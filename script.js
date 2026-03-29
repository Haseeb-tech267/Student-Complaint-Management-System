// ================= CONFIG =================
const API_URL = "https://69b67dfd583f543fbd9dd9cf.mockapi.io/complaints";

// ================= PAGE LOAD =================
window.onload = function () {
  if (document.getElementById("studentLoginView")) initStudent();
  if (document.getElementById("adminLogin")) initAdmin();
};

// ================= STUDENT =================
function initStudent() {
  const loginForm = document.getElementById("studentLoginForm");
  const complaintForm = document.getElementById("complaintForm");

  loginForm.onsubmit = function (e) {
    e.preventDefault();
    const roll = loginForm.studentUser.value.trim();
    if (!roll) return alert("Enter Roll No");

    sessionStorage.setItem("studentRoll", roll);
    const rollInput = document.getElementById("rollNo");
    if (rollInput) rollInput.value = roll;

    showStudentPanel();
  };

  document.getElementById("studentLogout").onclick = function () {
    sessionStorage.removeItem("studentRoll");
    location.reload();
  };

  complaintForm.onsubmit = async function (e) {
    e.preventDefault();
    await submitComplaint();
  };

  if (sessionStorage.getItem("studentRoll")) {
    showStudentPanel();
  }
}

function showStudentPanel() {
  document.getElementById("studentLoginView").style.display = "none";
  document.getElementById("studentComplaintView").style.display = "block";
  loadStudentComplaints();
}

async function submitComplaint() {
  const form = document.getElementById("complaintForm");
  const roll = sessionStorage.getItem("studentRoll") || "";

  const complaint = {
    name: form.name.value.trim(),
    rollNo: (form.rollNo.value || roll).trim(),
    email: form.email.value.trim(),
    mobile: form.mobile.value.trim(),
    category: form.category.value,
    message: form.message.value.trim(),
    status: "InProgress",
    date: new Date().toLocaleDateString()
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaint)
    });

    if (!res.ok) throw new Error("POST failed");

    alert("Complaint Submitted Successfully");
    form.reset();
    await loadStudentComplaints(complaint.rollNo);
  } catch (err) {
    console.error(err);
    alert("Failed to submit complaint. Please try again.");
  }
}

async function loadStudentComplaints(rollOverride) {
  const roll = (rollOverride || sessionStorage.getItem("studentRoll") || "").trim().toLowerCase();
  const tbody = document.querySelector("#studentComplaintsTable tbody");
  tbody.innerHTML = "";

  if (!roll) {
    tbody.innerHTML = "<tr><td colspan='4'>No Complaints</td></tr>";
    return;
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("GET failed");

    const data = await res.json();
    const my = data.filter(c => {
      const r1 = String(c.rollNo || "").trim().toLowerCase();
      const r2 = String(c.roll || "").trim().toLowerCase();
      const em = String(c.email || "").trim().toLowerCase();
      return r1 === roll || r2 === roll || em === roll;
    });

    if (my.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4'>No Complaints</td></tr>";
      return;
    }

    my.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>${c.category || ""}</td>
          <td>${c.message || ""}</td>
          <td>${c.status || ""}</td>
          <td>${c.date || ""}</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='4'>Failed to load complaints</td></tr>";
  }
}

// ================= ADMIN =================
function initAdmin() {
  const adminForm = document.getElementById("LoginForm");

  adminForm.onsubmit = function (e) {
    e.preventDefault();
    const u = adminForm.adminUsername.value;
    const p = adminForm.adminPassword.value;

    if (u === "admin" && p === "admin123") {
      sessionStorage.setItem("admin", "yes");
      showAdminPanel();
    } else {
      alert("Invalid Login");
    }
  };

  document.getElementById("logoutBtn").onclick = function () {
    sessionStorage.removeItem("admin");
    location.reload();
  };

  if (sessionStorage.getItem("admin") === "yes") {
    showAdminPanel();
  }
}

function showAdminPanel() {
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminPortal").style.display = "block";
  loadAdminComplaints();
}

async function loadAdminComplaints() {
  const tbody = document.querySelector("#complaintsTable tbody");
  tbody.innerHTML = "";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("GET failed");

    const data = await res.json();
    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='8'>No Complaints Found</td></tr>";
      return;
    }

    data.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>${c.name || ""}</td>
          <td>${c.rollNo || ""}</td>
          <td>${c.email || ""}</td>
          <td>${c.mobile || ""}</td>
          <td>${c.category || ""}</td>
          <td>${c.message || ""}</td>
          <td>
            <select onchange="changeStatus('${c.id}', this.value)">
              <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
              <option ${c.status === "InProgress" ? "selected" : ""}>InProgress</option>
              <option ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
            </select>
          </td>
          <td>
            <button onclick="deleteComplaint('${c.id}')">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='8'>Failed to load complaints</td></tr>";
  }
}

async function changeStatus(id, status) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!res.ok) throw new Error("PUT failed");
    await loadAdminComplaints();
  } catch (err) {
    console.error(err);
    alert("Failed to update status.");
  }
}

async function deleteComplaint(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("DELETE failed");

    await loadAdminComplaints();
  } catch (err) {
    console.error(err);
    alert("Failed to delete complaint.");
  }
}
