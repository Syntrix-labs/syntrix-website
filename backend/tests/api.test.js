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
