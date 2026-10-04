/**
 * End-to-end API tests against an in-memory MongoDB.
 * Run with: npm test  (from the backend folder)
 *
 * Covers auth, admin gating, projects, tasks, meetings, payments,
 * consultations, team, advertisements, notifications, uploads, and the
 * admin summary/clients endpoints.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Configure env BEFORE requiring the app (dotenv won't override existing vars).
process.env.JWT_SECRET = "test-secret-key";
process.env.ADMIN_EMAILS = "admin@syntrix.test";
process.env.NODE_ENV = "test";
// Neutralize email so tests never send real mail. dotenv won't override these
// already-set (empty) vars, so the mailer treats no provider as configured.
process.env.RESEND_API_KEY = "";
process.env.EMAIL_USER = "";
process.env.EMAIL_PASS = "";

let mongod;
let app;
let request;

// shared state across the ordered tests
const client = { email: "client@syntrix.test", password: "password123", token: "", id: "" };
const admin = { email: "admin@syntrix.test", password: "password123", token: "" };
let projectId = "";
let meetingId = "";
let paymentId = "";
let teamId = "";
let teamToken = "";

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  request = require("supertest");
  app = require("../server").app;
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

// ---------- health ----------
test("GET /api/health returns ok", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.match(res.body.message, /API is running/);
});

// ---------- signup ----------
test("signup rejects short password", async () => {
  const res = await request(app).post("/api/auth/signup").send({ name: "X", email: "bad@e.com", password: "123" });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test("signup creates a client account", async () => {
  const res = await request(app).post("/api/auth/signup").send({ name: "Test Client", email: client.email, password: client.password });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.isAdmin, false);
});

test("signup rejects a duplicate email", async () => {
  const res = await request(app).post("/api/auth/signup").send({ name: "Dup", email: client.email, password: client.password });
  assert.equal(res.status, 400);
});

test("signup creates an admin account (email in ADMIN_EMAILS)", async () => {
  const res = await request(app).post("/api/auth/signup").send({ name: "Admin", email: admin.email, password: admin.password });
  assert.equal(res.status, 201);
  assert.equal(res.body.isAdmin, true);
});

// ---------- login ----------
test("login rejects wrong password", async () => {
  const res = await request(app).post("/api/auth/login").send({ email: client.email, password: "wrongpass" });
  assert.equal(res.status, 400);
});

test("login succeeds for client and admin", async () => {
  const c = await request(app).post("/api/auth/login").send({ email: client.email, password: client.password });
  assert.equal(c.status, 200);
  assert.ok(c.body.token);
  client.token = c.body.token;

  const a = await request(app).post("/api/auth/login").send({ email: admin.email, password: admin.password });
  assert.equal(a.status, 200);
  assert.equal(a.body.isAdmin, true);
  admin.token = a.body.token;
});

// ---------- me / auth guard ----------
test("GET /api/auth/me requires a token", async () => {
  const res = await request(app).get("/api/auth/me");
  assert.equal(res.status, 401);
});

test("GET /api/auth/me returns the logged-in user", async () => {
  const res = await request(app).get("/api/auth/me").set("x-auth-token", client.token);
  assert.equal(res.status, 200);
  assert.equal(res.body.email, client.email);
  assert.equal(res.body.isAdmin, false);
  client.id = res.body._id;
});

// ---------- admin gating ----------
test("admin summary is forbidden for clients, allowed for admins", async () => {
  const forbidden = await request(app).get("/api/admin/summary").set("x-auth-token", client.token);
  assert.equal(forbidden.status, 403);

  const ok = await request(app).get("/api/admin/summary").set("x-auth-token", admin.token);
  assert.equal(ok.status, 200);
  assert.equal(typeof ok.body.totalClients, "number");
});

test("GET /api/admin/clients lists clients for admin", async () => {
  const res = await request(app).get("/api/admin/clients").set("x-auth-token", admin.token);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.some((u) => u.email === client.email));
});

test("admin can edit a client's details", async () => {
  const res = await request(app).put(`/api/admin/clients/${client.id}`).set("x-auth-token", admin.token).send({ phone: "9990001234" });
  assert.equal(res.status, 200);
  assert.equal(res.body.client.phone, "9990001234");
});

test("admin can delete a client and cascade their data", async () => {
  const su = await request(app).post("/api/auth/signup").send({ name: "Temp", email: "temp-del@syntrix.test", password: "password123" });
  const me = await request(app).get("/api/auth/me").set("x-auth-token", su.body.token);
  const del = await request(app).delete(`/api/admin/clients/${me.body._id}`).set("x-auth-token", admin.token);
  assert.equal(del.status, 200);
  assert.equal(del.body.success, true);
  const list = await request(app).get("/api/admin/clients").set("x-auth-token", admin.token);
  assert.ok(!list.body.some((u) => u.email === "temp-del@syntrix.test"));
});

test("non-admin cannot delete a client", async () => {
  const res = await request(app).delete(`/api/admin/clients/${client.id}`).set("x-auth-token", client.token);
  assert.equal(res.status, 403);
});

// ---------- projects ----------
test("client cannot create a project (admin only)", async () => {
  const res = await request(app).post("/api/projects").set("x-auth-token", client.token).send({ title: "Nope" });
  assert.equal(res.status, 403);
});

test("admin assigns a project to a client by email", async () => {
  const res = await request(app).post("/api/projects").set("x-auth-token", admin.token)
    .send({ title: "Client Website", clientEmail: client.email, description: "Build it" });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  projectId = res.body.project._id;
});

test("client sees their assigned project", async () => {
  const res = await request(app).get("/api/projects").set("x-auth-token", client.token);
  assert.equal(res.status, 200);
  assert.ok(res.body.some((p) => p._id === projectId));
});

test("project update changes status and creates a notification", async () => {
  const res = await request(app).put(`/api/projects/${projectId}`).set("x-auth-token", admin.token).send({ status: "In Progress" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "In Progress");

  const notes = await request(app).get("/api/notifications").set("x-auth-token", client.token);
  assert.equal(notes.status, 200);
  assert.ok(notes.body.some((n) => /In Progress/.test(n.message)));
});

test("admin can delete a project", async () => {
  const created = await request(app).post("/api/projects").set("x-auth-token", admin.token)
    .send({ title: "Temp", clientEmail: client.email, description: "temp" });
  const delRes = await request(app).delete(`/api/projects/${created.body.project._id}`).set("x-auth-token", admin.token);
  assert.equal(delRes.status, 200);
});

// ---------- tasks ----------
test("client can add and list tasks on their project", async () => {
  const add = await request(app).post(`/api/tasks/${projectId}`).set("x-auth-token", client.token).send({ title: "Wireframes" });
  assert.equal(add.status, 201);
  const list = await request(app).get(`/api/tasks/${projectId}`).set("x-auth-token", client.token);
  assert.equal(list.status, 200);
  assert.ok(list.body.some((t) => t.title === "Wireframes"));
});

// ---------- meetings ----------
test("client books a meeting; admin confirms it", async () => {
  const book = await request(app).post("/api/meetings/book").set("x-auth-token", client.token)
    .send({ date: "2026-07-01", time: "15:00", notes: "Kickoff" });
  assert.equal(book.status, 201);
  meetingId = book.body.meeting._id;

  const mine = await request(app).get("/api/meetings").set("x-auth-token", client.token);
  assert.ok(mine.body.some((m) => m._id === meetingId));

  const confirm = await request(app).put(`/api/meetings/${meetingId}`).set("x-auth-token", admin.token).send({ status: "Confirmed" });
  assert.equal(confirm.status, 200);
  assert.equal(confirm.body.meeting.status, "Confirmed");
  assert.ok(confirm.body.meeting.meetingLink); // default link applied
});

// ---------- payments ----------
test("admin creates a payment; client sees it; admin marks paid", async () => {
  const create = await request(app).post("/api/payments").set("x-auth-token", admin.token)
    .send({ title: "Milestone 1", amount: 5000, clientEmail: client.email, dueDate: "2026-07-15" });
  assert.equal(create.status, 201);
  paymentId = create.body.payment._id;
  assert.equal(create.body.payment.currency, "INR");

  const mine = await request(app).get("/api/payments").set("x-auth-token", client.token);
  assert.ok(mine.body.some((p) => p._id === paymentId));

  const paid = await request(app).put(`/api/payments/${paymentId}`).set("x-auth-token", admin.token).send({ status: "Paid" });
  assert.equal(paid.body.payment.status, "Paid");
});

// ---------- consultations ----------
test("admin sends a consultation message; client reads it", async () => {
  const send = await request(app).post("/api/consultations").set("x-auth-token", admin.token)
    .send({ client: client.id, senderRole: "Admin", message: "Welcome aboard" });
  assert.equal(send.status, 201);

  const mine = await request(app).get("/api/consultations").set("x-auth-token", client.token);
  assert.ok(mine.body.some((m) => m.message === "Welcome aboard"));

  const all = await request(app).get("/api/consultations/admin/all").set("x-auth-token", admin.token);
  assert.equal(all.status, 200);
});

test("client can post a consultation reply to their own thread", async () => {
  const send = await request(app).post("/api/consultations").set("x-auth-token", client.token)
    .send({ message: "Thanks! A question about the timeline." });
  assert.equal(send.status, 201);
  assert.equal(send.body.message.senderRole, "Client");

  const mine = await request(app).get("/api/consultations").set("x-auth-token", client.token);
  assert.ok(mine.body.some((m) => m.message.includes("timeline")));
});

test("consultation rejects an empty message", async () => {
  const res = await request(app).post("/api/consultations").set("x-auth-token", client.token).send({ message: "   " });
  assert.equal(res.status, 400);
});

// ---------- team ----------
test("admin can create, list, update, and delete team members", async () => {
  const create = await request(app).post("/api/team").set("x-auth-token", admin.token).send({ name: "Soham", role: "Backend" });
  assert.equal(create.status, 201);
  teamId = create.body.member._id;

  const list = await request(app).get("/api/team").set("x-auth-token", admin.token);
  assert.ok(list.body.some((m) => m._id === teamId));

  const upd = await request(app).put(`/api/team/${teamId}`).set("x-auth-token", admin.token).send({ status: "Online" });
  assert.equal(upd.body.member.status, "Online");

  const del = await request(app).delete(`/api/team/${teamId}`).set("x-auth-token", admin.token);
  assert.equal(del.body.success, true);
});

// ---------- team meetings (internal) ----------
test("admin can create, list, and delete a team meeting", async () => {
  const create = await request(app).post("/api/team-meetings").set("x-auth-token", admin.token)
    .send({ title: "Sprint sync", date: "2026-10-05", time: "10:00", agenda: "planning" });
  assert.equal(create.status, 201);
  const id = create.body.meeting._id;

  const list = await request(app).get("/api/team-meetings").set("x-auth-token", admin.token);
  assert.ok(list.body.some((m) => m._id === id));

  const del = await request(app).delete(`/api/team-meetings/${id}`).set("x-auth-token", admin.token);
  assert.equal(del.body.success, true);
});

test("team meeting requires title, date, time", async () => {
  const res = await request(app).post("/api/team-meetings").set("x-auth-token", admin.token).send({ title: "x" });
  assert.equal(res.status, 400);
});

test("non-admin cannot list team meetings", async () => {
  const res = await request(app).get("/api/team-meetings").set("x-auth-token", client.token);
  assert.equal(res.status, 403);
});

// ---------- team member accounts (role: team) ----------
test("adding a team member with email provisions a team account (temp pw 123456)", async () => {
  const add = await request(app).post("/api/team").set("x-auth-token", admin.token)
    .send({ name: "Mate Dev", role: "Developer", email: "mate@syntrix.test" });
  assert.equal(add.status, 201);
  assert.equal(add.body.accountCreated, true);

  const login = await request(app).post("/api/auth/login").send({ email: "mate@syntrix.test", password: "123456" });
  assert.equal(login.status, 200);
  assert.equal(login.body.isTeam, true);
  assert.equal(login.body.isAdmin, false);
  teamToken = login.body.token;
});

test("team member only sees client meetings they are assigned to", async () => {
  // Admin schedules a client meeting and invites the team member to join.
  const assigned = await request(app).post("/api/meetings").set("x-auth-token", admin.token)
    .send({ client: client.id, title: "Kickoff", date: "2026-07-01", time: "15:00", assignees: ["MATE@syntrix.test"] });
  assert.equal(assigned.status, 201);
  assert.deepEqual(assigned.body.meeting.assignees, ["mate@syntrix.test"]); // normalized

  // A second meeting the team member is NOT invited to.
  await request(app).post("/api/meetings").set("x-auth-token", admin.token)
    .send({ client: client.id, title: "Private", date: "2026-07-02", time: "16:00" });

  const mine = await request(app).get("/api/meetings/assigned").set("x-auth-token", teamToken);
  assert.equal(mine.status, 200);
  const titles = mine.body.map((m) => m.title);
  assert.ok(titles.includes("Kickoff"));
  assert.ok(!titles.includes("Private"));

  // Admin sees all meetings on the same endpoint.
  const adminView = await request(app).get("/api/meetings/assigned").set("x-auth-token", admin.token);
  assert.ok(adminView.body.length >= 2);
});

test("clients list excludes admins and team members", async () => {
  const res = await request(app).get("/api/admin/clients").set("x-auth-token", admin.token);
  assert.equal(res.status, 200);
  const emails = res.body.map((u) => u.email);
  assert.ok(emails.includes(client.email)); // real client stays
  assert.ok(!emails.includes("admin@syntrix.test")); // admin excluded
  assert.ok(!emails.includes("mate@syntrix.test")); // team member excluded
});

test("dashboard client count matches the clients list (no admins or team)", async () => {
  const list = await request(app).get("/api/admin/clients").set("x-auth-token", admin.token);
  const summary = await request(app).get("/api/admin/summary").set("x-auth-token", admin.token);
  assert.equal(summary.body.totalClients, list.body.length);
});

test("team member can use staff endpoints", async () => {
  assert.equal((await request(app).get("/api/consultations/admin/all").set("x-auth-token", teamToken)).status, 200);
  assert.equal((await request(app).get("/api/meetings/admin/all").set("x-auth-token", teamToken)).status, 200);
  assert.equal((await request(app).get("/api/team-meetings").set("x-auth-token", teamToken)).status, 200);
  assert.equal((await request(app).get("/api/admin/clients").set("x-auth-token", teamToken)).status, 200);
});

test("team member is blocked from admin-only endpoints", async () => {
  assert.equal((await request(app).get("/api/admin/summary").set("x-auth-token", teamToken)).status, 403);
  assert.equal((await request(app).post("/api/projects").set("x-auth-token", teamToken).send({ title: "x" })).status, 403);
  assert.equal((await request(app).post("/api/payments").set("x-auth-token", teamToken).send({ title: "x", amount: 1 })).status, 403);
  assert.equal((await request(app).post("/api/team").set("x-auth-token", teamToken).send({ name: "x", role: "y" })).status, 403);
  assert.equal((await request(app).post("/api/advertisements").set("x-auth-token", teamToken).send({ title: "x", imageUrl: "x", projectUrl: "x" })).status, 403);
});

// ---------- advertisements ----------
test("admin publishes an ad; it appears on the public endpoint", async () => {
  const create = await request(app).post("/api/advertisements").set("x-auth-token", admin.token)
    .send({ title: "Demo Site", imageUrl: "http://x/i.png", projectUrl: "http://x" });
  assert.equal(create.status, 201);

  const pub = await request(app).get("/api/advertisements"); // no token — public
  assert.equal(pub.status, 200);
  assert.ok(pub.body.some((a) => a.title === "Demo Site"));
});

// ---------- uploads ----------
test("client uploads a document", async () => {
  const res = await request(app).post("/api/uploads")
    .set("x-auth-token", client.token)
    .attach("clientFile", Buffer.from("hello world"), "note.txt");
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.document.storage, "local");

  const mine = await request(app).get("/api/uploads").set("x-auth-token", client.token);
  assert.ok(mine.body.some((d) => d.originalName === "note.txt"));
});

// ---------- contracts ----------
let contractId = "";

test("non-admin cannot list contracts", async () => {
  const res = await request(app).get("/api/contracts").set("x-auth-token", client.token);
  assert.equal(res.status, 403);
});

test("contract generation rejects an unknown type", async () => {
  const res = await request(app).post("/api/contracts/generate").set("x-auth-token", admin.token)
    .send({ type: "nonsense", name: "X" });
  assert.equal(res.status, 400);
});

test("admin generates a client contract (PDF stored, no email configured)", async () => {
  const res = await request(app).post("/api/contracts/generate").set("x-auth-token", admin.token)
    .send({ type: "client", name: "Acme Pvt Ltd", email: "ops@acme.test", scope: "a marketing website", fee: 150000, timeline: "6 weeks" });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.contract.type, "client");
  assert.equal(res.body.contract.status, "Draft"); // no RESEND/SMTP in tests
  assert.equal(res.body.emailed, false);
  assert.ok(res.body.contract.fileName.endsWith(".pdf"));
});

test("admin generates a member contract linked to an existing user by email", async () => {
  const res = await request(app).post("/api/contracts/generate").set("x-auth-token", admin.token)
    .send({ type: "member-contractor", email: client.email, role: "Frontend Developer", fee: 40000, sendEmail: false });
  assert.equal(res.status, 201);
  assert.equal(res.body.contract.type, "member-contractor");
  assert.equal(res.body.contract.partyName, "Test Client"); // resolved from the user
  contractId = res.body.contract._id;
});

test("admin generates a member contract with a per-deal share", async () => {
  const res = await request(app).post("/api/contracts/generate").set("x-auth-token", admin.token)
    .send({ type: "member-employee", name: "Share Hire", role: "Engineer", compType: "both", fee: 50000, share: "20% of each deal's value", sendEmail: false });
  assert.equal(res.status, 201);
  assert.equal(res.body.contract.details.compType, "both");
  assert.equal(res.body.contract.details.share, "20% of each deal's value");
});

test("admin lists contracts", async () => {
  const res = await request(app).get("/api/contracts").set("x-auth-token", admin.token);
  assert.equal(res.status, 200);
  assert.ok(res.body.length >= 2);
});

test("the linked user sees their own contract via /mine", async () => {
  const res = await request(app).get("/api/contracts/mine").set("x-auth-token", client.token);
  assert.equal(res.status, 200);
  assert.ok(res.body.some((c) => c._id === contractId));
});

test("admin can download the generated PDF", async () => {
  const res = await request(app).get(`/api/contracts/${contractId}/download`).set("x-auth-token", admin.token);
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /application\/pdf/);
});

test("admin can mark a contract signed, then delete it", async () => {
  const signed = await request(app).put(`/api/contracts/${contractId}/status`).set("x-auth-token", admin.token).send({ status: "Signed" });
  assert.equal(signed.status, 200);
  assert.equal(signed.body.contract.status, "Signed");

  const del = await request(app).delete(`/api/contracts/${contractId}`).set("x-auth-token", admin.token);
  assert.equal(del.status, 200);
  assert.equal(del.body.success, true);
});

// ---------- social sign-in ----------
test("OAuth: google stays off without keys, and padded keys are trimmed", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  let res = await request(app).get("/api/auth/oauth/providers");
  assert.deepEqual(res.body.enabled, []);
  res = await request(app).get("/api/auth/oauth/google");
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /\/login\?error=google_unavailable$/);

  // A stray space pasted into the hosting dashboard must not break the client id.
  process.env.GOOGLE_CLIENT_ID = "  1234-abc.apps.googleusercontent.com \n";
  process.env.GOOGLE_CLIENT_SECRET = " secret ";
  process.env.PUBLIC_APP_URL = "https://syntrixlabs.in";
  res = await request(app).get("/api/auth/oauth/providers");
  assert.deepEqual(res.body.enabled, ["google"]);
  res = await request(app).get("/api/auth/oauth/google");
  assert.equal(res.status, 302);
  const url = new URL(res.headers.location);
  assert.equal(url.host, "accounts.google.com");
  assert.equal(url.searchParams.get("client_id"), "1234-abc.apps.googleusercontent.com");
  assert.equal(url.searchParams.get("redirect_uri"), "https://syntrixlabs.in/api/auth/oauth/google/callback");
  assert.ok(url.searchParams.get("state"));

  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.PUBLIC_APP_URL;
});

// ---------- consultation file sharing ----------
const binary = (res, cb) => { const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => cb(null, Buffer.concat(chunks))); };
let chatFileId = "";

test("client sends a file in consultation; it lasts 30 days", async () => {
  const png = Buffer.from("89504e470d0a1a0a-fake-logo", "utf8");
  const res = await request(app).post("/api/consultations/attachment").set("x-auth-token", client.token)
    .field("message", "Here is our old logo")
    .attach("file", png, { filename: "old-logo.png", contentType: "image/png" });
  assert.equal(res.status, 201);
  const m = res.body.message;
  assert.equal(m.senderRole, "Client");
  assert.equal(m.message, "Here is our old logo");
  assert.equal(m.attachment.name, "old-logo.png");
  assert.equal(m.attachment.size, png.length);
  const days = (new Date(m.attachment.expiresAt) - Date.now()) / 86400000;
  assert.ok(days > 29.9 && days <= 30, `expires in ${days} days`);
  chatFileId = m.attachment.fileId;

  const thread = await request(app).get("/api/consultations").set("x-auth-token", client.token);
  assert.ok(thread.body.some((x) => x.attachment && x.attachment.fileId === chatFileId));
});

test("chat file: owner and staff can download, other clients cannot", async () => {
  const own = await request(app).get(`/api/consultations/files/${chatFileId}`).set("x-auth-token", client.token).buffer(true).parse(binary);
  assert.equal(own.status, 200);
  assert.equal(own.body.toString("utf8"), "89504e470d0a1a0a-fake-logo");
  assert.match(own.headers["content-disposition"], /^attachment; filename\*=UTF-8''old-logo\.png$/);
  assert.equal(own.headers["x-content-type-options"], "nosniff");

  const staff = await request(app).get(`/api/consultations/files/${chatFileId}`).set("x-auth-token", admin.token).buffer(true).parse(binary);
  assert.equal(staff.status, 200);

  const other = await request(app).post("/api/auth/signup").send({ name: "Other Client", email: "other-client@syntrix.test", password: "password123" });
  const denied = await request(app).get(`/api/consultations/files/${chatFileId}`).set("x-auth-token", other.body.token);
  assert.equal(denied.status, 403);

  const anon = await request(app).get(`/api/consultations/files/${chatFileId}`);
  assert.equal(anon.status, 401);
});

test("staff sends a design file into a chosen client's thread", async () => {
  const res = await request(app).post("/api/consultations/attachment").set("x-auth-token", admin.token)
    .field("client", client.id).field("message", "New logo concept v1")
    .attach("file", Buffer.from("<svg/>"), { filename: "logo-v1.svg", contentType: "image/svg+xml" });
  assert.equal(res.status, 201);
  assert.equal(res.body.message.senderRole, "Admin");
  assert.equal(res.body.message.senderName, "Admin");
  assert.equal(String(res.body.message.client), client.id);

  const noClient = await request(app).post("/api/consultations/attachment").set("x-auth-token", admin.token)
    .attach("file", Buffer.from("x"), "a.png");
  assert.equal(noClient.status, 400);
});

test("chat file: blocks programs, empty uploads and files over 10 MB", async () => {
  const exe = await request(app).post("/api/consultations/attachment").set("x-auth-token", client.token)
    .attach("file", Buffer.from("MZ"), "setup.exe");
  assert.equal(exe.status, 400);

  const none = await request(app).post("/api/consultations/attachment").set("x-auth-token", client.token).field("message", "hi");
  assert.equal(none.status, 400);

  const big = await request(app).post("/api/consultations/attachment").set("x-auth-token", client.token)
    .attach("file", Buffer.alloc(10 * 1024 * 1024 + 1), "huge.zip");
  assert.equal(big.status, 413);
});

test("chat file: after 30 days it can't be downloaded but the message stays", async () => {
  const ChatFile = require("../models/ChatFile");
  await ChatFile.updateOne({ _id: chatFileId }, { expiresAt: new Date(Date.now() - 1000) });

  const res = await request(app).get(`/api/consultations/files/${chatFileId}`).set("x-auth-token", client.token);
  assert.equal(res.status, 410);
  assert.equal(res.body.expired, true);

  // Simulate MongoDB's TTL monitor having removed the bytes entirely.
  await ChatFile.deleteOne({ _id: chatFileId });
  const gone = await request(app).get(`/api/consultations/files/${chatFileId}`).set("x-auth-token", client.token);
  assert.equal(gone.status, 410);

  const thread = await request(app).get("/api/consultations").set("x-auth-token", client.token);
  const msg = thread.body.find((x) => x.attachment && x.attachment.fileId === chatFileId);
  assert.ok(msg, "message with the expired file is still in the thread");
  assert.equal(msg.attachment.name, "old-logo.png");

  // The TTL index exists so MongoDB deletes expired files on its own.
  const indexes = await ChatFile.collection.indexes();
  assert.ok(indexes.some((i) => i.key.expiresAt === 1 && i.expireAfterSeconds === 0), JSON.stringify(indexes));
});

// ---------- chat notifications ----------
const webpush = require("web-push");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const resetThread = async () => {
  await request(app).post("/api/consultations/read").set("x-auth-token", client.token);
  await request(app).post("/api/consultations/read").set("x-auth-token", admin.token).send({ client: client.id });
};

test("unread badges: both sides see unread counts and can mark read", async () => {
  await resetThread();
  await request(app).post("/api/consultations").set("x-auth-token", admin.token).send({ client: client.id, message: "Logo v2 is ready" });
  let u = await request(app).get("/api/consultations/unread").set("x-auth-token", client.token);
  assert.equal(u.body.total, 1);
  let s = await request(app).get("/api/consultations/unread").set("x-auth-token", admin.token);
  assert.equal(s.body.byClient[client.id] || 0, 0, "staff's own message isn't unread for staff");

  await request(app).post("/api/consultations").set("x-auth-token", client.token).send({ message: "Love it!" });
  s = await request(app).get("/api/consultations/unread").set("x-auth-token", admin.token);
  assert.equal(s.body.byClient[client.id], 1);
  assert.ok(s.body.total >= 1);

  assert.equal((await request(app).post("/api/consultations/read").set("x-auth-token", client.token)).body.marked, 1);
  u = await request(app).get("/api/consultations/unread").set("x-auth-token", client.token);
  assert.equal(u.body.total, 0);

  assert.equal((await request(app).post("/api/consultations/read").set("x-auth-token", admin.token).send({ client: client.id })).body.marked, 1);
  s = await request(app).get("/api/consultations/unread").set("x-auth-token", admin.token);
  assert.equal(s.body.byClient[client.id] || 0, 0);

  assert.equal((await request(app).post("/api/consultations/read").set("x-auth-token", admin.token).send({})).status, 400);
});

test("push: key, subscribe, and new messages push to the other side only", async () => {
  const PushSubscription = require("../models/PushSubscription");
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  assert.deepEqual((await request(app).get("/api/notifications/push/key")).body, { enabled: false });

  const vapid = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = vapid.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
  process.env.VAPID_SUBJECT = "https://syntrixlabs.in";
  const key = await request(app).get("/api/notifications/push/key");
  assert.equal(key.body.enabled, true);
  assert.equal(key.body.publicKey, vapid.publicKey);

  const bad = await request(app).post("/api/notifications/push/subscribe").set("x-auth-token", client.token).send({ subscription: { endpoint: "http://insecure" } });
  assert.equal(bad.status, 400);
  const clientSub = { endpoint: "https://push.example.com/client-phone", keys: { p256dh: "p1", auth: "a1" } };
  const adminSub = { endpoint: "https://push.example.com/admin-laptop", keys: { p256dh: "p2", auth: "a2" } };
  assert.equal((await request(app).post("/api/notifications/push/subscribe").set("x-auth-token", client.token).send({ subscription: clientSub })).status, 201);
  assert.equal((await request(app).post("/api/notifications/push/subscribe").set("x-auth-token", admin.token).send({ subscription: adminSub })).status, 201);

  const calls = [];
  const original = webpush.sendNotification;
  const waitFor = async (n) => { for (let i = 0; i < 60 && calls.length < n; i++) await sleep(20); await sleep(60); };
  try {
    webpush.sendNotification = async (target, payload) => { calls.push({ endpoint: target.endpoint, payload: JSON.parse(payload) }); };

    await request(app).post("/api/consultations").set("x-auth-token", admin.token).send({ client: client.id, message: "Can we hop on a call?" });
    await waitFor(1);
    assert.equal(calls.length, 1, JSON.stringify(calls));
    assert.equal(calls[0].endpoint, clientSub.endpoint);
    assert.equal(calls[0].payload.url, "/dashboard/consultation");
    assert.equal(calls[0].payload.title, "Admin · Syntrix");
    assert.match(calls[0].payload.body, /hop on a call/);

    calls.length = 0;
    await request(app).post("/api/consultations").set("x-auth-token", client.token).send({ message: "Sure, 5pm?" });
    await waitFor(1);
    assert.equal(calls.length, 1, "only staff devices, not the client's own");
    assert.equal(calls[0].endpoint, adminSub.endpoint);
    assert.equal(calls[0].payload.url, `/admin/consultation?client=${client.id}`);
    assert.match(calls[0].payload.title, /^New message from /);

    // A device that was uninstalled/unsubscribed (410) gets removed.
    webpush.sendNotification = async () => { const e = new Error("gone"); e.statusCode = 410; throw e; };
    await request(app).post("/api/consultations").set("x-auth-token", admin.token).send({ client: client.id, message: "ping" });
    for (let i = 0; i < 60 && (await PushSubscription.exists({ endpoint: clientSub.endpoint })); i++) await sleep(20);
    assert.equal(await PushSubscription.exists({ endpoint: clientSub.endpoint }), null);
  } finally {
    webpush.sendNotification = original;
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
  }

  assert.equal((await request(app).post("/api/notifications/push/unsubscribe").set("x-auth-token", admin.token).send({ endpoint: adminSub.endpoint })).status, 200);
  assert.equal(await PushSubscription.exists({ endpoint: adminSub.endpoint }), null);
});

test("email reminders: only after 10 min unread, one per streak, reset after reading, daily cap", async () => {
  const Consultation = require("../models/Consultation");
  const { runEmailSweep } = require("../utils/chatNotifier");
  await resetThread();
  await Consultation.updateMany({}, { $set: { emailedAt: new Date() } }); // earlier tests' messages are out of scope

  const sent = [];
  const send = async (mail) => { sent.push(mail); return true; };
  const age = (id, min) => Consultation.collection.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { createdAt: new Date(Date.now() - min * 60000) } });
  const staffSays = async (text) => (await request(app).post("/api/consultations").set("x-auth-token", admin.token).send({ client: client.id, message: text })).body.message;
  const clientSays = async (text) => (await request(app).post("/api/consultations").set("x-auth-token", client.token).send({ message: text })).body.message;

  const m1 = await staffSays("Please review the <b>logo</b>");
  await runEmailSweep({ send });
  assert.equal(sent.length, 0, "fresh message: no email yet");

  await age(m1._id, 11);
  await runEmailSweep({ send });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, client.email);
  assert.equal(sent[0].subject, "New message from Admin");
  assert.match(sent[0].html, /&lt;b&gt;logo&lt;\/b&gt;/, "message text is HTML-escaped");
  assert.match(sent[0].text, /\/dashboard\/consultation/);

  const m2 = await staffSays("One more thing");
  await age(m2._id, 11);
  await runEmailSweep({ send });
  assert.equal(sent.length, 1, "same unread streak: no second email");

  await request(app).post("/api/consultations/read").set("x-auth-token", client.token);
  const m3 = await staffSays("New version uploaded");
  await age(m3._id, 11);
  await runEmailSweep({ send });
  assert.equal(sent.length, 2, "client read it, so a new streak emails again");

  const c1 = await clientSays("Thanks, looks great");
  await age(c1._id, 11);
  await runEmailSweep({ send });
  assert.equal(sent.length, 3);
  assert.deepEqual(sent[2].to, ["admin@syntrix.test"], "client messages remind the admins");
  assert.match(sent[2].text, new RegExp(`/admin/consultation\\?client=${client.id}`));

  process.env.CHAT_EMAIL_DAILY_CAP = "0";
  try {
    await request(app).post("/api/consultations/read").set("x-auth-token", admin.token).send({ client: client.id });
    const c2 = await clientSays("Another question");
    await age(c2._id, 11);
    await runEmailSweep({ send });
    assert.equal(sent.length, 3, "daily cap stops further emails");
  } finally {
    delete process.env.CHAT_EMAIL_DAILY_CAP;
  }
});

test("messages from before notifications launched count as already read", async () => {
  const Consultation = require("../models/Consultation");
  const { backfillReadState } = require("../utils/chatNotifier");
  const created = new Date("2026-01-01T10:00:00Z");
  const { insertedId } = await Consultation.collection.insertOne({ client: new mongoose.Types.ObjectId(client.id), senderRole: "Admin", message: "old", createdAt: created, updatedAt: created });
  await backfillReadState();
  const doc = await Consultation.collection.findOne({ _id: insertedId });
  assert.equal(doc.readAt.toISOString(), created.toISOString());
  assert.equal(doc.emailedAt.toISOString(), created.toISOString());
  await Consultation.collection.deleteOne({ _id: insertedId });
});
