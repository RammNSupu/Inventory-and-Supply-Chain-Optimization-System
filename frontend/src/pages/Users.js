import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    branch_id: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchBranches();
  }, []);

  /* =========================
     FETCH USERS
  ========================= */

  const fetchUsers = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/users"
    );

    setUsers(res.data);
  };

  /* =========================
     FETCH USER STATS
  ========================= */

  const fetchStats = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/users/stats/summary"
    );

    setStats(res.data);
  };

  /* =========================
     FETCH BRANCHES
  ========================= */

  const fetchBranches = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/branches"
    );

    setBranches(res.data);
  };

  /* =========================
     CREATE USER
  ========================= */

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  const createUser = async (e) => {

    e.preventDefault();

    await axios.post(
      "http://localhost:5000/api/users",
      form
    );

    setForm({
      name: "",
      email: "",
      password: "",
      role: "staff",
      branch_id: ""
    });

    fetchUsers();
    fetchStats();
  };

  /* =========================
     TOGGLE USER STATUS
  ========================= */

  const toggleUser = async (id) => {

    await axios.put(
      `http://localhost:5000/api/users/toggle/${id}`
    );

    fetchUsers();
  };

  /* =========================
     DELETE USER
  ========================= */

  const deleteUser = async (id) => {

    if (!window.confirm("Delete this user?")) return;

    await axios.delete(
      `http://localhost:5000/api/users/${id}`
    );

    fetchUsers();
    fetchStats();
  };

  /* =========================
     SEARCH FILTER
  ========================= */

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     ROLE BADGES
  ========================= */

  const roleBadge = (role) => {

    if (role === "admin") return "🔴 Admin";
    if (role === "manager") return "🟡 Manager";
    return "🔵 Staff";

  };

  return (

    <div className="container mt-4">

      <h2>User Management</h2>

      {/* =========================
          STATS CARDS
      ========================= */}

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>

        <div>👥 Total Users: {stats.total_users}</div>

        <div>✅ Active Users: {stats.active_users}</div>

        <div>🛡 Admins: {stats.admin_users}</div>

      </div>


      {/* =========================
          SEARCH
      ========================= */}

      <input
        type="text"
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />


      {/* =========================
          CREATE USER FORM
      ========================= */}

      <h3 style={{ marginTop: "20px" }}>
        Create New User
      </h3>

      <form onSubmit={createUser} style={{ marginBottom: "20px" }}>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>


        {/* Branch Dropdown */}

        <select
          name="branch_id"
          value={form.branch_id}
          onChange={handleChange}
        >

          <option value="">
            Select Branch
          </option>

          {branches.map((b) => (

            <option
              key={b.branch_id}
              value={b.branch_id}
            >
              {b.branch_name}
            </option>

          ))}

        </select>

        <button type="submit">
          Create User
        </button>

      </form>


      {/* =========================
          USERS TABLE
      ========================= */}

      <table border="1" width="100%" style={{ marginTop: "15px" }}>

        <thead>

          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Branch</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>

        </thead>

        <tbody>

          {filteredUsers.map((u) => (

            <tr key={u.user_id}>

              <td>{u.user_id}</td>

              <td>{u.full_name}</td>

              <td>{u.email}</td>

              <td>{roleBadge(u.role)}</td>

              <td>{u.branch_name || "-"}</td>

              <td>
                {u.is_active
                  ? "🟢 Active"
                  : "🔴 Disabled"}
              </td>

              <td>

                <button
                  onClick={() => toggleUser(u.user_id)}
                >
                  Toggle
                </button>

                <button
                  onClick={() => deleteUser(u.user_id)}
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

};

export default Users;