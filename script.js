// Configuration
//const API_BASE = "/api"
const API_BASE = "http://localhost:5000/api"

// Global State
let currentUser = null
let students = []
let payments = []
let courses = []
let users = []
let selectedStudentForPayment = null
let editingUserId = null

let recentStudentsAll = [] // sorted list for dashboard only
let recentStudentsPage = 1
let recentStudentsPageSize = 5

// DOM Elements
const loginPage = document.getElementById("loginPage")
const dashboardPage = document.getElementById("dashboardPage")
const loadingOverlay = document.getElementById("loadingOverlay")

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  checkAuthStatus()
})

// Initialize App
function initializeApp() {
  // Set current date for enrollment
  const today = new Date().toISOString().split("T")[0]
  const enrollmentDateInput = document.getElementById("enrollmentDate")
  if (enrollmentDateInput) {
    enrollmentDateInput.value = today
  }

  // Load theme
  const savedTheme = localStorage.getItem("theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)
  updateThemeIcon(savedTheme)
}

// Setup Event Listeners
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

  // Tab navigation
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      switchTab(e.target.dataset.tab)
    })
  })

  // Add student
  const addStudentBtn = document.getElementById("addStudentBtn")
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", openAddStudentModal)
  }

  const addStudentForm = document.getElementById("addStudentForm")
  if (addStudentForm) {
    addStudentForm.addEventListener("submit", handleAddStudent)
  }

  // Add course
  const addCourseBtn = document.getElementById("addCourseBtn")
  if (addCourseBtn) {
    addCourseBtn.addEventListener("click", openAddCourseModal)
  }

  const addCourseForm = document.getElementById("addCourseForm")
  if (addCourseForm) {
    addCourseForm.addEventListener("submit", handleAddCourse)
  }

  // Add user
  const addUserBtn = document.getElementById("addUserBtn")
  if (addUserBtn) {
    addUserBtn.addEventListener("click", openAddUserModal)
  }

  const addUserForm = document.getElementById("addUserForm")
  if (addUserForm) {
    addUserForm.addEventListener("submit", handleAddUser)
  }

  // Payment form
  const paymentForm = document.getElementById("paymentForm")
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePayment)
  }

  // Export report
  const exportReportBtn = document.getElementById("exportReportBtn")
  if (exportReportBtn) {
    exportReportBtn.addEventListener("click", exportReport)
  }

  // Refresh dashboard
  const refreshDashboard = document.getElementById("refreshDashboard")
  if (refreshDashboard) {
    refreshDashboard.addEventListener("click", loadDashboardData)
  }

  // Modal close buttons
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal")
      closeModal(modal.id)
    })
  })

  // Search and filters
  const searchStudents = document.getElementById("searchStudents")
  if (searchStudents) {
    searchStudents.addEventListener("input", filterStudents)
  }

  const statusFilter = document.getElementById("statusFilter")
  if (statusFilter) {
    statusFilter.addEventListener("change", filterStudents)
  }

  const branchFilter = document.getElementById("branchFilter")
  if (branchFilter) {
    branchFilter.addEventListener("change", filterStudents)
  }

  const courseFilter = document.getElementById("courseFilter")
  if (courseFilter) {
    courseFilter.addEventListener("change", filterStudents)
  }

  const clearFilters = document.getElementById("clearFilters")
  if (clearFilters) {
    clearFilters.addEventListener("click", clearAllFilters)
  }

  // Download buttons
  const downloadAllStudents = document.getElementById("downloadAllStudents")
  if (downloadAllStudents) {
    downloadAllStudents.addEventListener("click", () => downloadStudentsByStatus("all"))
  }

  const downloadActiveStudents = document.getElementById("downloadActiveStudents")
  if (downloadActiveStudents) {
    downloadActiveStudents.addEventListener("click", () => downloadStudentsByStatus("Active"))
  }

  const downloadInactiveStudents = document.getElementById("downloadInactiveStudents")
  if (downloadInactiveStudents) {
    downloadInactiveStudents.addEventListener("click", () => downloadStudentsByStatus("Inactive"))
  }

  const downloadCompletedStudents = document.getElementById("downloadCompletedStudents")
  if (downloadCompletedStudents) {
    downloadCompletedStudents.addEventListener("click", () => downloadStudentsByStatus("Completed"))
  }

  const downloadDroppedStudents = document.getElementById("downloadDroppedStudents")
  if (downloadDroppedStudents) {
    downloadDroppedStudents.addEventListener("click", () => downloadStudentsByStatus("Dropped"))
  }

  // Payment date filter
  const paymentDateFilter = document.getElementById("paymentDateFilter")
  if (paymentDateFilter) {
    paymentDateFilter.addEventListener("change", filterPayments)
  }

  const clearPaymentFilter = document.getElementById("clearPaymentFilter")
  if (clearPaymentFilter) {
    clearPaymentFilter.addEventListener("click", clearPaymentFilters)
  }

  // Close modals on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target.id)
    }
  })

  const editUserForm = document.getElementById("editUserForm")
  if (editUserForm) {
    editUserForm.addEventListener("submit", handleEditUser)
  }
  const deleteUserBtn = document.getElementById("deleteUserBtn")
  if (deleteUserBtn) {
    deleteUserBtn.addEventListener("click", confirmDeleteUser)
  }
}

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault()

  const username = document.getElementById("username").value
  const password = document.getElementById("password").value

  if (!username || !password) {
    showToast("Please enter username and password", "error")
    return
  }

  try {
    showLoading(true)
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (data.success) {
      currentUser = data.user
      localStorage.setItem("authToken", data.token)
      showDashboard()
      showToast(`Welcome back, ${data.user.username}!`, "success")
      loadDashboardData()
    } else {
      showToast(data.message || "Login failed", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showToast("Login failed. Please check your connection and make sure the backend server is running.", "error")
  } finally {
    showLoading(false)
  }
}

function handleLogout() {
  currentUser = null
  localStorage.removeItem("authToken")
  showLoginPage()
  showToast("Logged out successfully", "success")

  // Clear data
  students = []
  payments = []
  courses = []
  users = []
}

async function checkAuthStatus() {
  const token = localStorage.getItem("authToken")
  if (!token) {
    showLoginPage()
    return
  }

  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (data.success) {
      currentUser = data.user
      showDashboard()
      loadDashboardData()
    } else {
      localStorage.removeItem("authToken")
      showLoginPage()
    }
  } catch (error) {
    console.error("Token verification error:", error)
    localStorage.removeItem("authToken")
    showLoginPage()
  }
}

// Page Navigation
function showLoginPage() {
  hideAllPages()
  loginPage.classList.add("active")
}

function showDashboard() {
  hideAllPages()
  dashboardPage.classList.add("active")

  if (currentUser) {
    document.getElementById("welcomeUser").textContent = `Welcome, ${currentUser.username}`

    // Show users tab only for admins
    const usersTab = document.getElementById("usersTab")
    if (currentUser.role === "admin") {
      usersTab.style.display = "block"
    } else {
      usersTab.style.display = "none"
    }
  }
}

function hideAllPages() {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })
}

// Tab Management
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active")
  })
  document.getElementById(tabName).classList.add("active")

  // Load tab-specific data
  switch (tabName) {
    case "dashboard":
      loadDashboardData()
      break
    case "students":
      loadStudents()
      break
    case "payments":
      loadPayments()
      break
    case "courses":
      loadCourses()
      break
    case "reports":
      loadReports()
      break
    case "users":
      if (currentUser.role === "admin") {
        loadUsers()
      }
      break
  }
}

// Theme Management
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  document.documentElement.setAttribute("data-theme", newTheme)
  localStorage.setItem("theme", newTheme)
  updateThemeIcon(newTheme)
}

function updateThemeIcon(theme) {
  const icon = document.querySelector("#themeToggle i")
  if (icon) {
    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon"
  }
}

// Password Toggle
function togglePassword() {
  const passwordInput = document.getElementById("password")
  const toggleBtn = document.querySelector(".password-toggle i")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    toggleBtn.className = "fas fa-eye-slash"
  } else {
    passwordInput.type = "password"
    toggleBtn.className = "fas fa-eye"
  }
}

// API Helper
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("authToken")
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

function toDateSafe(val) {
  try {
    return new Date(val)
  } catch {
    return new Date()
  }
}

// Dashboard Functions
async function loadDashboardData() {
  try {
    showLoading(true)

    // Keeps API the same and avoids backend changes.
    const [studentsData, paymentsData, coursesData] = await Promise.all([
      apiCall(`/students?page=1&page_size=100`), // pull up to 100 for recent list
      apiCall(`/payments?page=1&page_size=25`),
      apiCall(`/courses?page=1&page_size=100`),
    ])

    students = studentsData.data || []
    payments = paymentsData.data || []
    courses = coursesData.data || []

    recentStudentsAll = [...students].sort((a, b) => {
      const da = toDateSafe(a.enrollment_date || a.created_at || 0)
      const db = toDateSafe(b.enrollment_date || b.created_at || 0)
      return db - da
    })

    // Initialize page size from selector if present
    const sizeSel = document.getElementById("recentStudentsPageSize")
    if (sizeSel) {
      const selVal = Number.parseInt(sizeSel.value, 10)
      if (!Number.isNaN(selVal)) recentStudentsPageSize = selVal
      sizeSel.onchange = () => {
        recentStudentsPageSize = Number.parseInt(sizeSel.value, 10) || 5
        recentStudentsPage = 1
        updateRecentStudentsTable()
      }
    }

    updateDashboardStats()
    updateRecentStudentsTable()
    populateCourseFilters()
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    showToast("Error loading data", "error")
  } finally {
    showLoading(false)
  }
}

async function updateDashboardStats() {
  try {
    const response = await apiCall("/stats")
    const stats = response.data

    document.getElementById("totalStudents").textContent = stats.total_students
    document.getElementById("totalRevenue").textContent = `₹${(stats.total_revenue || 0).toLocaleString()}`
    document.getElementById("pendingAmount").textContent = `₹${(stats.total_pending || 0).toLocaleString()}`
    document.getElementById("totalCourses").textContent = stats.total_courses
  } catch (error) {
    console.error("Error loading dashboard stats:", error)
    showToast("Error loading dashboard stats", "error")
  }
}

function updateRecentStudentsTable() {
  const tbody = document.querySelector("#recentStudentsTable tbody")
  if (!tbody) return
  tbody.innerHTML = ""

  if (!recentStudentsAll || recentStudentsAll.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="fas fa-users"></i>
          <p>No students found. Add your first student to get started!</p>
        </td>
      </tr>
    `
    updateRecentStudentsPagination(0)
    return
  }

  const total = recentStudentsAll.length
  const totalPages = Math.max(1, Math.ceil(total / recentStudentsPageSize))
  if (recentStudentsPage > totalPages) recentStudentsPage = totalPages

  const start = (recentStudentsPage - 1) * recentStudentsPageSize
  const pageItems = recentStudentsAll.slice(start, start + recentStudentsPageSize)

  pageItems.forEach((student) => {
    // Build row specifically for dashboard columns to avoid mismatch errors with createStudentRow
    const row = document.createElement("tr")
    const phone = student.phone || ""
    const enrolled = student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : ""
    const father = student.father || ""
    const course = student.course || ""

    row.innerHTML = `
      <td>${student.name || ""}</td>
      <td>${phone}</td>
      <td>${enrolled}</td>
      <td>${father}</td>
      <td>${course}</td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-outline" onclick="openPaymentModal('${student.id}')">
            <i class="fas fa-credit-card"></i> Pay
          </button>
          <button class="btn btn-sm btn-outline" onclick="confirmDeleteStudent('${student.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `
    tbody.appendChild(row)
  })

  updateRecentStudentsPagination(totalPages)
}

function updateRecentStudentsPagination(totalPages) {
  let paginationDiv = document.getElementById("recentStudentsPagination")
  if (!paginationDiv) {
    // table container has it in HTML; but ensure exists for safety
    paginationDiv = document.createElement("div")
    paginationDiv.id = "recentStudentsPagination"
    paginationDiv.className = "pagination-controls"
    const parent = document.querySelector("#recentStudentsTable")?.parentElement
    if (parent) parent.appendChild(paginationDiv)
  }

  if (!totalPages || totalPages < 1) {
    paginationDiv.innerHTML = ""
    return
  }

  paginationDiv.innerHTML = `
    <button class="btn btn-sm" ${recentStudentsPage === 1 ? "disabled" : ""} onclick="(function(){ recentStudentsPage = Math.max(1, recentStudentsPage - 1); updateRecentStudentsTable(); })()">
      Prev
    </button>
    <span>Page ${recentStudentsPage} of ${totalPages}</span>
    <button class="btn btn-sm" ${recentStudentsPage >= totalPages ? "disabled" : ""} onclick="(function(){ recentStudentsPage = Math.min(${totalPages}, recentStudentsPage + 1); updateRecentStudentsTable(); })()">
      Next
    </button>
  `
}

function updateStudentsTableLegacy() {
  // Legacy no-op: call the main implementation if present
  if (typeof updateStudentsTable === "function") {
    updateStudentsTable()
  }
}

// New pagination variables
let studentsPage = 1
const studentsPageSize = 25
let studentsTotal = 0

// New loadStudents function
async function loadStudents(page = 1) {
  try {
    showLoading(true)
    const response = await apiCall(`/students?page=${page}&page_size=${studentsPageSize}`)
    students = response.data || []
    studentsTotal = response.total || 0
    studentsPage = response.page || 1

    updateStudentsTable()
    updateStudentsPagination()
  } catch (error) {
    console.error("Error loading students:", error)
    showToast("Error loading students", "error")
  } finally {
    showLoading(false)
  }
}

// Update table (no slicing here, backend already paginates)
function updateStudentsTable() {
  const tbody = document.querySelector("#studentsTable tbody")
  tbody.innerHTML = ""

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <i class="fas fa-users"></i>
          <p>No students found</p>
        </td>
      </tr>
    `
    return
  }

  students.forEach((student) => {
    const row = createStudentRow(student, false)
    tbody.appendChild(row)
  })
}

// New pagination controls
function updateStudentsPagination() {
  const totalPages = Math.ceil(studentsTotal / studentsPageSize)
  let paginationDiv = document.getElementById("studentsPagination")
  if (!paginationDiv) {
    paginationDiv = document.createElement("div")
    paginationDiv.id = "studentsPagination"
    paginationDiv.className = "pagination-controls"
    document.querySelector("#studentsTable").parentElement.appendChild(paginationDiv)
  }

  paginationDiv.innerHTML = `
    <button class="btn btn-sm" ${studentsPage === 1 ? "disabled" : ""} onclick="loadStudents(${studentsPage - 1})">Prev</button>
    <span>Page ${studentsPage} of ${totalPages}</span>
    <button class="btn btn-sm" ${studentsPage >= totalPages ? "disabled" : ""} onclick="loadStudents(${studentsPage + 1})">Next</button>
  `
}

function createStudentRow(student, isRecent = false) {
  const row = document.createElement("tr")
  const balance = student.total_fee - (student.paid_amount || 0)

  // Calculate status
  let status = student.status
  // Find course duration in months
  const course = courses.find((c) => c.name === student.course)
  let courseMonths = 0
  if (course && course.duration) {
    // Extract number from duration string (e.g., '6 months')
    const match = course.duration.match(/(\d+)/)
    if (match) courseMonths = Number.parseInt(match[1], 10)
  }
  // Calculate end date
  let endDate = null
  if (student.enrollment_date && courseMonths > 0) {
    const enrollDate = new Date(student.enrollment_date)
    endDate = new Date(enrollDate.setMonth(enrollDate.getMonth() + courseMonths))
  }
  const today = new Date()
  if (student.status === "Dropped") {
    status = "Dropped"
  } else if ((student.paid_amount || 0) >= student.total_fee) {
    status = "Completed"
  } else if (endDate && today > endDate) {
    status = "Inactive"
  } else {
    status = "Active"
  }

  const statusBadge = getStatusBadge(status)
  const feeBadge = balance > 0 ? "badge-danger" : "badge-success"

  const discountBadge =
    student.discount && student.discount > 0 ? '<span class="badge badge-warning">Discounted</span>' : ""

  const columns = [
    student.name,
    student.phone || "",
    student.dob ? new Date(student.dob).toLocaleDateString() : "",
    student.father || "",
    student.course,
    ...(isRecent ? [] : [`₹${student.total_fee} ${discountBadge}`, `₹${student.paid_amount || 0}`, `₹${balance}`]),
    new Date(student.enrollment_date).toLocaleDateString(),
    `<span class="badge ${statusBadge}">${status}</span>`,
    ...(isRecent ? [`<span class="badge ${feeBadge}">₹${student.paid_amount || 0}/₹${student.total_fee}</span>`] : []),
    `
            <div class="flex gap-2">
                ${
                  balance > 0 && status !== "Dropped"
                    ? `
                    <button class="btn btn-sm btn-primary" onclick="openPaymentModal('${student.id}')">
                        <i class="fas fa-credit-card"></i> Pay
                    </button>
                `
                    : ""
                }
                <button class="btn btn-sm btn-outline" onclick="generateReceipt('${student.id}')">
                    <i class="fas fa-file-pdf"></i> Receipt
                </button>
                 ${
                   status === "Dropped"
                     ? `
                <button class="btn btn-sm btn-outline" style="color: var(--success-color); border-color: var(--success-color);" onclick="markAsUndropped('${student.id}')">
                <i class="fas fa-user-check"></i> Undrop
                </button>
                      `
                     : `
                <button class="btn btn-sm btn-outline" style="color: var(--warning-color); border-color: var(--warning-color);" onclick="markAsDropped('${student.id}')">
                <i class="fas fa-user-times"></i> Drop
                </button>
                  `
                 }


                ${
                  currentUser && currentUser.role === "admin"
                    ? `
                <button class="btn btn-sm btn-outline" style="color: var(--danger-color); border-color: var(--danger-color);" onclick="confirmDeleteStudent('${student.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                `
                    : ""
                }
            </div>
        `,
  ]

  row.innerHTML = columns.map((col) => `<td>${col}</td>`).join("")
  return row
}

function getStatusBadge(status) {
  switch (status) {
    case "Active":
      return "badge-success"
    case "Completed":
      return "badge-secondary"
    case "Inactive":
      return "badge-warning"
    case "Dropped":
      return "badge-danger"
    default:
      return "badge-secondary"
  }
}

function getFilteredStudents() {
  const searchTerm = document.getElementById("searchStudents")?.value.toLowerCase() || ""
  const branchFilter = document.getElementById("branchFilter")?.value || "all"
  const statusFilter = document.getElementById("statusFilter")?.value || "all"
  const courseFilter = document.getElementById("courseFilter")?.value || "all"

  return students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm) ||
      (student.phone && student.phone.toLowerCase().includes(searchTerm)) ||
      (student.father && student.father.toLowerCase().includes(searchTerm))

    // Calculate actual status (same logic as in createStudentRow)
    let actualStatus = student.status
    const course = courses.find((c) => c.name === student.course)
    let courseMonths = 0
    if (course && course.duration) {
      const match = course.duration.match(/(\d+)/)
      if (match) courseMonths = Number.parseInt(match[1], 10)
    }
    let endDate = null
    if (student.enrollment_date && courseMonths > 0) {
      const enrollDate = new Date(student.enrollment_date)
      endDate = new Date(enrollDate.setMonth(enrollDate.getMonth() + courseMonths))
    }
    const today = new Date()
    if (student.status === "Dropped") {
      actualStatus = "Dropped"
    } else if ((student.paid_amount || 0) >= student.total_fee) {
      actualStatus = "Completed"
    } else if (endDate && today > endDate) {
      actualStatus = "Inactive"
    } else {
      actualStatus = "Active"
    }

    const matchesBranch = branchFilter === "all" || student.branch === branchFilter
    const matchesStatus = statusFilter === "all" || actualStatus === statusFilter
    const matchesCourse = courseFilter === "all" || student.course === courseFilter

    return matchesSearch && matchesBranch && matchesStatus && matchesCourse
  })
}

function filterStudents() {
  updateStudentsTable()
  updateDownloadButtons()
}

function clearAllFilters() {
  document.getElementById("searchStudents").value = ""
  document.getElementById("branchFilter").value = "all"
  document.getElementById("statusFilter").value = "all"
  document.getElementById("courseFilter").value = "all"
  updateStudentsTable()
}

function populateCourseFilters() {
  const courseFilter = document.getElementById("courseFilter")
  const studentCourse = document.getElementById("studentCourse")

  if (courseFilter) {
    courseFilter.innerHTML = '<option value="all">All Courses</option>'
    courses.forEach((course) => {
      courseFilter.innerHTML += `<option value="${course.name}">${course.name}</option>`
    })
  }

  if (studentCourse) {
    studentCourse.innerHTML = '<option value="">Select a course</option>'
    courses.forEach((course) => {
      studentCourse.innerHTML += `<option value="${course.name}">${course.name} - ₹${course.fee}</option>`
    })
  }
}

function openAddStudentModal() {
  openModal("addStudentModal")
}

async function handleAddStudent(e) {
  e.preventDefault()

  const discountValue = Number.parseFloat(document.getElementById("studentDiscount").value) || 0
  const selectedCourseName = document.getElementById("studentCourse").value
  const selectedCourse = courses.find((c) => c.name === selectedCourseName)
  const courseFee = selectedCourse ? selectedCourse.fee : 0
  let discountedFee = courseFee - discountValue
  if (discountedFee < 0) discountedFee = 0

  const formData = {
    name: document.getElementById("studentName").value,
    father: document.getElementById("studentFather").value,
    phone: document.getElementById("studentPhone").value,
    dob: document.getElementById("studentDOB").value,
    course: selectedCourseName,
    branch: document.getElementById("studentBranch").value,
    enrollment_date: document.getElementById("enrollmentDate").value,
    discount: discountValue,
    total_fee: discountedFee,
  }

  if (!formData.name || !formData.father || !formData.dob || !formData.course) {
    showToast("Please fill in all required fields", "error")
    return
  }

  try {
    showLoading(true)
    const response = await apiCall("/students", {
      method: "POST",
      body: JSON.stringify(formData),
    })

    if (response.success) {
      showToast("Student added successfully!", "success")
      closeModal("addStudentModal")
      document.getElementById("addStudentForm").reset()
      document.getElementById("enrollmentDate").value = new Date().toISOString().split("T")[0]
      loadStudents()
      loadDashboardData()
    } else {
      showToast(response.message || "Error adding student", "error")
    }
  } catch (error) {
    console.error("Error adding student:", error)
    showToast("Error adding student", "error")
  } finally {
    showLoading(false)
  }
}

// Course Management
async function loadCourses() {
  try {
    showLoading(true)
    const response = await apiCall("/courses")
    courses = response.data || []
    updateCoursesTable()
  } catch (error) {
    console.error("Error loading courses:", error)
    showToast("Error loading courses", "error")
  } finally {
    showLoading(false)
  }
}

function updateCoursesTable() {
  const tbody = document.querySelector("#coursesTable tbody")
  tbody.innerHTML = ""

  if (courses.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>No courses found. Add your first course to get started!</p>
                </td>
            </tr>
        `
    return
  }

  courses.forEach((course) => {
    const enrolledCount = students.filter((s) => s.course === course.name).length
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${course.name}</td>
            <td>${course.duration}</td>
            <td>₹${course.fee}</td>
            <td>${course.description}</td>
            <td>${enrolledCount} students</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editCourse('${course._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

function openAddCourseModal() {
  openModal("addCourseModal")
}

async function handleAddCourse(e) {
  e.preventDefault()

  const formData = {
    name: document.getElementById("courseName").value,
    duration: document.getElementById("courseDuration").value,
    fee: Number.parseFloat(document.getElementById("courseFee").value),
    description: document.getElementById("courseDescription").value,
  }

  if (!formData.name || !formData.duration || !formData.fee) {
    showToast("Please fill in all required fields", "error")
    return
  }

  try {
    showLoading(true)
    const response = await apiCall("/courses", {
      method: "POST",
      body: JSON.stringify(formData),
    })

    if (response.success) {
      showToast("Course added successfully!", "success")
      closeModal("addCourseModal")
      document.getElementById("addCourseForm").reset()
      loadCourses()
      populateCourseFilters()
    } else {
      showToast(response.message || "Error adding course", "error")
    }
  } catch (error) {
    console.error("Error adding course:", error)
    showToast("Error adding course", "error")
  } finally {
    showLoading(false)
  }
}

// User Management
async function loadUsers() {
  try {
    showLoading(true)
    const response = await apiCall("/users")
    users = response.data || []
    updateUsersTable()
  } catch (error) {
    console.error("Error loading users:", error)
    showToast("Error loading users", "error")
  } finally {
    showLoading(false)
  }
}

function updateUsersTable() {
  const tbody = document.querySelector("#usersTable tbody")
  tbody.innerHTML = ""

  if (users.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No users found</p>
                </td>
            </tr>
        `
    return
  }

  users.forEach((user) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === "admin" ? "badge-success" : "badge-secondary"}">${user.role}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                ${
                  currentUser && currentUser.role === "admin"
                    ? `<button class="btn btn-sm btn-outline" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>`
                    : ""
                }
            </td>
        `
    tbody.appendChild(row)
  })
}

function openAddUserModal() {
  openModal("addUserModal")
}

async function handleAddUser(e) {
  e.preventDefault()

  const formData = {
    username: document.getElementById("newUsername").value,
    email: document.getElementById("newUserEmail").value,
    password: document.getElementById("newUserPassword").value,
    role: document.getElementById("newUserRole").value,
  }

  if (!formData.username || !formData.password) {
    showToast("Username and password are required", "error")
    return
  }

  try {
    showLoading(true)
    const response = await apiCall("/users", {
      method: "POST",
      body: JSON.stringify(formData),
    })

    if (response.success) {
      showToast("User added successfully!", "success")
      closeModal("addUserModal")
      document.getElementById("addUserForm").reset()
      loadUsers()
    } else {
      showToast(response.message || "Error adding user", "error")
    }
  } catch (error) {
    console.error("Error adding user:", error)
    showToast("Error adding user", "error")
  } finally {
    showLoading(false)
  }
}

// Payment Management
let paymentsPage = 1
const paymentsPageSize = 25
let paymentsTotal = 0

async function loadPayments(page = 1) {
  try {
    showLoading(true)
    const response = await apiCall(`/payments?page=${page}&page_size=${paymentsPageSize}`)
    payments = response.data || []
    paymentsTotal = response.total || 0
    paymentsPage = response.page || 1

    updatePaymentsTable()
    updatePaymentsPagination()
  } catch (error) {
    console.error("Error loading payments:", error)
    showToast("Error loading payments", "error")
  } finally {
    showLoading(false)
  }
}

function updatePaymentsPagination() {
  const totalPages = Math.ceil(paymentsTotal / paymentsPageSize)
  let paginationDiv = document.getElementById("paymentsPagination")
  if (!paginationDiv) {
    paginationDiv = document.createElement("div")
    paginationDiv.id = "paymentsPagination"
    paginationDiv.className = "pagination-controls"
    document.querySelector("#paymentsTable").parentElement.appendChild(paginationDiv)
  }

  paginationDiv.innerHTML = `
    <button class="btn btn-sm" ${paymentsPage === 1 ? "disabled" : ""} onclick="loadPayments(${paymentsPage - 1})">Prev</button>
    <span>Page ${paymentsPage} of ${totalPages}</span>
    <button class="btn btn-sm" ${paymentsPage >= totalPages ? "disabled" : ""} onclick="loadPayments(${paymentsPage + 1})">Next</button>
  `
}

function updatePaymentsTable() {
  const tbody = document.querySelector("#paymentsTable tbody")
  tbody.innerHTML = ""

  const filteredPayments = getFilteredPayments()

  if (filteredPayments.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <p>No payments found</p>
                </td>
            </tr>
        `
    return
  }

  filteredPayments.forEach((payment) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
            <td>${payment.student_name}</td>
            <td>₹${payment.amount}</td>
            <td class="capitalize">${payment.payment_method.replace("_", " ")}</td>
            <td class="font-mono">${payment.receipt_number}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="downloadPaymentReceipt('${payment.id}')">
                    <i class="fas fa-download"></i> Receipt
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

function getFilteredPayments() {
  const dateFilter = document.getElementById("paymentDateFilter")?.value

  if (!dateFilter) return payments

  return payments.filter((payment) => {
    const paymentDate = new Date(payment.payment_date).toISOString().split("T")[0]
    return paymentDate === dateFilter
  })
}

function filterPayments() {
  updatePaymentsTable()
}

function clearPaymentFilters() {
  document.getElementById("paymentDateFilter").value = ""
  updatePaymentsTable()
}

function openPaymentModal(studentId) {
  const student = students.find((s) => s.id == studentId)
  if (!student) return

  selectedStudentForPayment = student
  const balance = student.total_fee - (student.paid_amount || 0)

  document.getElementById("paymentStudentInfo").innerHTML = `
        <div class="info-item">
            <span>Student:</span>
            <span>${student.name}</span>
        </div>
        <div class="info-item">
            <span>Course:</span>
            <span>${student.course}</span>
        </div>
        <div class="info-item">
            <span>Total Fee:</span>
            <span>₹${student.total_fee}</span>
        </div>
        <div class="info-item">
            <span>Paid Amount:</span>
            <span>₹${student.paid_amount || 0}</span>
        </div>
        <div class="info-item">
            <span>Outstanding Balance:</span>
            <span class="amount danger">₹${balance}</span>
        </div>
    `

  document.getElementById("paymentAmount").max = balance
  document.getElementById("paymentAmount").value = balance
  openModal("paymentModal")
}

async function handlePayment(e) {
  e.preventDefault()

  if (!selectedStudentForPayment) return

  const amount = Number.parseFloat(document.getElementById("paymentAmount").value)
  const method = document.getElementById("paymentMethod").value
  const feeType = document.getElementById("feeType").value
  const notes = document.getElementById("paymentNotes").value

  if (!amount || !method || !feeType) {
    showToast("Please fill in all required fields", "error")
    return
  }

  const balance = selectedStudentForPayment.total_fee - (selectedStudentForPayment.paid_amount || 0)
  if (amount > balance) {
    showToast("Payment amount cannot exceed balance", "error")
    return
  }

  const paymentData = {
    student_id: selectedStudentForPayment.id,
    amount: amount,
    payment_method: method,
    fee_type: feeType,
    notes: notes,
  }

  try {
    showLoading(true)
    const response = await apiCall("/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })

    if (response.success) {
      showToast("Payment processed successfully!", "success")
      closeModal("paymentModal")
      document.getElementById("paymentForm").reset()

      // Generate and download receipt
      generatePaymentReceipt(response.data)

      loadStudents()
      loadDashboardData()
      loadPayments()
    } else {
      showToast(response.message || "Error processing payment", "error")
    }
  } catch (error) {
    console.error("Error processing payment:", error)
    showToast("Error processing payment", "error")
  } finally {
    showLoading(false)
  }
}

// Reports
function loadReports() {
  const activeStudents = students.filter((s) => s.status !== "Dropped")
  const droppedStudents = students.filter((s) => s.status === "Dropped")

  const totalExpected = activeStudents.reduce((sum, s) => sum + s.total_fee, 0)
  const totalCollected = activeStudents.reduce((sum, s) => sum + (s.paid_amount || 0), 0)
  const outstanding = totalExpected - totalCollected
  const collectionRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0
  const droppedStudentsFees = droppedStudents.reduce((sum, s) => sum + s.total_fee, 0)

  document.getElementById("expectedRevenue").textContent = `₹${totalExpected.toLocaleString()}`
  document.getElementById("collectedRevenue").textContent = `₹${totalCollected.toLocaleString()}`
  document.getElementById("outstandingAmount").textContent = `₹${outstanding.toLocaleString()}`
  document.getElementById("collectionRate").textContent = `${collectionRate}%`
  document.getElementById("droppedStudentsFees").textContent = `₹${droppedStudentsFees.toLocaleString()}`

  document.getElementById("reportTotalStudents").textContent = students.length
  document.getElementById("reportActiveStudents").textContent = activeStudents.filter(
    (s) => s.status === "Active",
  ).length
  document.getElementById("reportTotalPayments").textContent = payments.length
}

// PDF Generation
function generateReceipt(studentId) {
  const student = students.find((s) => s.id == studentId)
  if (!student) return

  const { jsPDF } = window.jspdf
  const doc = new jsPDF("p", "mm", "a4")

  // Set page to half A4 size (A5)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight() / 2

  // Header with logo
  doc.setFontSize(16)
  doc.setTextColor(220, 38, 38) // Red color

  // Add logo image with proper async loading
  const img = new Image()
  img.onload = () => {
    doc.addImage(img, "JPEG", 15, 8, 12, 12) // Position logo at (15,8) with size 12x12mm
  }
  img.onerror = () => {
    // Fallback to placeholder if image fails to load
    doc.setFillColor(220, 38, 38)
    doc.circle(20, 15, 4, "F")
  }
  img.src = "gurukulss.jpg"

  // Institute name with logo
  doc.text("GURUKUL COMPUTER INSTITUTE", pageWidth / 2, 15, { align: "center" })

  doc.setFontSize(12)
  doc.setTextColor(31, 41, 55)
  doc.text("Fee Payment Receipt", pageWidth / 2, 25, { align: "center" })

  // Receipt details
  doc.setFontSize(9)
  doc.setTextColor(31, 41, 55)
  doc.text(`Receipt No: RCP-${student.id.toString().padStart(8, "0")}`, 20, 35)
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 35, { align: "right" })

  // Student details table (compact for A5)
  doc.autoTable({
    startY: 40,
    head: [["Field", "Details"]],
    body: [
      ["Student Name", student.name],
      ["Father's Name", student.father || ""],
      ["Phone", student.phone || ""],
      ["Course", student.course],
      ["Total Fee", `₹${student.total_fee}`],
      ...(student.discount && student.discount > 0 ? [["Discount", `₹${student.discount}`]] : []),
      ["Paid Amount", `₹${student.paid_amount || 0}`],
      ["Balance", `₹${student.total_fee - (student.paid_amount || 0)}`],
      [
        "Status",
        (() => {
          // Use the same status logic as in the table
          let status = student.status
          const course = courses.find((c) => c.name === student.course)
          let courseMonths = 0
          if (course && course.duration) {
            const match = course.duration.match(/(\d+)/)
            if (match) courseMonths = Number.parseInt(match[1], 10)
          }
          let endDate = null
          if (student.enrollment_date && courseMonths > 0) {
            const enrollDate = new Date(student.enrollment_date)
            endDate = new Date(enrollDate.setMonth(enrollDate.getMonth() + courseMonths))
          }
          const today = new Date()
          if ((student.paid_amount || 0) >= student.total_fee) {
            status = "Completed"
          } else if (endDate && today > endDate) {
            status = "Inactive"
          } else {
            status = "Active"
          }
          return status
        })(),
      ],
      ["Enrollment Date", new Date(student.enrollment_date).toLocaleDateString()],
    ],
    theme: "grid",
    headStyles: { fillColor: [220, 38, 38] }, // Red
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 110 } },
    margin: { top: 5, right: 10, bottom: 5, left: 10 },
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated by: ${currentUser ? currentUser.username : "N/A"}`, pageWidth / 2, pageHeight - 15, {
    align: "center",
  })
  doc.text("Thank you for choosing Gurukul Computer Institute!", pageWidth / 2, pageHeight - 10, { align: "center" })
  doc.text("This is a computer generated receipt.", pageWidth / 2, pageHeight - 5, { align: "center" })

  doc.save(`receipt-${student.name.replace(/\s+/g, "-")}.pdf`)
  showToast("Receipt downloaded successfully!", "success")
}

function generatePaymentReceipt(payment) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF("p", "mm", "a4")

  // Set page to half A4 size (A5)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight() / 2

  // Header with logo
  doc.setFontSize(16)
  doc.setTextColor(220, 38, 38) // Red color

  // Add logo image with proper async loading
  const img = new Image()
  img.onload = () => {
    doc.addImage(img, "JPEG", 15, 8, 12, 12) // Position logo at (15,8) with size 12x12mm
  }
  img.onerror = () => {
    // Fallback to placeholder if image fails to load
    doc.setFillColor(220, 38, 38)
    doc.circle(20, 15, 4, "F")
  }
  img.src = "gurukulss.jpg"

  // Institute name with logo
  doc.text("GURUKUL COMPUTER INSTITUTE", pageWidth / 2, 15, { align: "center" })

  doc.setFontSize(12)
  doc.setTextColor(31, 41, 55)
  doc.text("Payment Receipt", pageWidth / 2, 25, { align: "center" })

  // Receipt details
  doc.setFontSize(9)
  doc.setTextColor(31, 41, 55)
  doc.text(`Receipt No: ${payment.receipt_number}`, 20, 35)
  doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, pageWidth - 20, 35, { align: "right" })

  // Payment details table
  doc.autoTable({
    startY: 40,
    head: [["Field", "Details"]],
    body: [
      ["Student Name", payment.student_name],
      ["Amount Paid", `₹${payment.amount}`],
      ["Fee Type", payment.fee_type ? payment.fee_type.replace(/([A-Z])/g, " $1").trim() : "N/A"],
      ["Payment Method", payment.payment_method.replace("_", " ")],
      ["Receipt Number", payment.receipt_number],
      ["Payment Date", new Date(payment.payment_date).toLocaleDateString()],
      ["Received By", currentUser ? currentUser.username : "N/A"],
      ...(payment.notes ? [["Notes", payment.notes]] : []),
    ],
    theme: "grid",
    headStyles: { fillColor: [220, 38, 38] }, // Red
    styles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 110 } },
    margin: { top: 5, right: 10, bottom: 5, left: 10 },
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated by: ${currentUser ? currentUser.username : "N/A"}`, pageWidth / 2, pageHeight - 15, {
    align: "center",
  })
  doc.text("Thank you for your payment!", pageWidth / 2, pageHeight - 10, { align: "center" })
  doc.text("This is a computer generated receipt.", pageWidth / 2, pageHeight - 5, { align: "center" })

  doc.save(`payment-receipt-${payment.receipt_number}.pdf`)
}

function exportReport() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(59, 130, 246)
  doc.text("Student Fee Report", 105, 25, { align: "center" })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: "center" })

  const tableData = students.map((student) => {
    // Calculate actual status (same logic as in createStudentRow)
    let actualStatus = student.status
    const course = courses.find((c) => c.name === student.course)
    let courseMonths = 0
    if (course && course.duration) {
      const match = course.duration.match(/(\d+)/)
      if (match) courseMonths = Number.parseInt(match[1], 10)
    }
    let endDate = null
    if (student.enrollment_date && courseMonths > 0) {
      const enrollDate = new Date(student.enrollment_date)
      endDate = new Date(enrollDate.setMonth(enrollDate.getMonth() + courseMonths))
    }
    const today = new Date()
    if ((student.paid_amount || 0) >= student.total_fee) {
      actualStatus = "Completed"
    } else if (endDate && today > endDate) {
      actualStatus = "Inactive"
    } else {
      actualStatus = "Active"
    }

    return [
      student.name,
      student.course,
      new Date(student.enrollment_date).toLocaleDateString(),
      `₹${student.total_fee}`,
      `₹${student.paid_amount || 0}`,
      `₹${student.total_fee - (student.paid_amount || 0)}`,
      actualStatus,
    ]
  })

  doc.autoTable({
    startY: 45,
    head: [["Name", "Course", "Enrollment", "Total Fee", "Paid", "Balance", "Status"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  })

  doc.save(`student-report-${new Date().toISOString().split("T")[0]}.pdf`)
  showToast("Report exported successfully!", "success")
}

// Modal Management
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active")
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active")
  selectedStudentForPayment = null
}

// Utility Functions
function showLoading(show) {
  if (show) {
    loadingOverlay.classList.add("active")
  } else {
    loadingOverlay.classList.remove("active")
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.className = `toast ${type} show`

  setTimeout(() => {
    toast.classList.remove("show")
  }, 4000)
}

// Additional utility functions
function editCourse(courseId) {
  showToast("Course editing feature coming soon!", "info")
}

function editUser(userId) {
  const user = users.find((u) => u.id === userId)
  if (!user) return
  editingUserId = userId
  document.getElementById("editUsername").value = user.username
  document.getElementById("editUserPassword").value = ""
  openModal("editUserModal")
}

async function handleEditUser(e) {
  e.preventDefault()
  if (!editingUserId) return
  const username = document.getElementById("editUsername").value
  const password = document.getElementById("editUserPassword").value
  if (!username) {
    showToast("Username is required", "error")
    return
  }
  try {
    showLoading(true)
    const body = { username }
    if (password) body.password = password
    const response = await apiCall(`/users/${editingUserId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
    if (response.success) {
      showToast("User updated successfully!", "success")
      closeModal("editUserModal")
      loadUsers()
    } else {
      showToast(response.message || "Error updating user", "error")
    }
  } catch (error) {
    console.error("Error updating user:", error)
    showToast("Error updating user", "error")
  } finally {
    showLoading(false)
  }
}

function confirmDeleteUser() {
  if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
    deleteUser(editingUserId)
  }
}

async function deleteUser(userId) {
  try {
    showLoading(true)
    const response = await apiCall(`/users/${userId}`, {
      method: "DELETE",
    })
    if (response.success) {
      showToast("User deleted successfully!", "success")
      closeModal("editUserModal")
      loadUsers()
    } else {
      showToast(response.message || "Error deleting user", "error")
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    showToast("Error deleting user", "error")
  } finally {
    showLoading(false)
  }
}

function downloadPaymentReceipt(paymentId) {
  const payment = payments.find((p) => p.id === paymentId)
  if (payment) {
    generatePaymentReceipt(payment)
  }
}

window.confirmDeleteStudent = (studentId) => {
  if (confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
    deleteStudent(studentId)
  }
}

async function deleteStudent(studentId) {
  try {
    showLoading(true)
    const response = await apiCall(`/students/${studentId}`, {
      method: "DELETE",
    })
    if (response.success) {
      showToast("Student deleted successfully!", "success")
      loadStudents()
      loadDashboardData()
    } else {
      showToast(response.message || "Error deleting student", "error")
    }
  } catch (error) {
    console.error("Error deleting student:", error)
    showToast("Error deleting student", "error")
  } finally {
    showLoading(false)
  }
}

// Download functions
function downloadStudentsByStatus(status) {
  const filteredStudents = students.filter((student) => {
    if (status === "all") return true

    // Calculate actual status
    let actualStatus = student.status
    const course = courses.find((c) => c.name === student.course)
    let courseMonths = 0
    if (course && course.duration) {
      const match = course.duration.match(/(\d+)/)
      if (match) courseMonths = Number.parseInt(match[1], 10)
    }
    let endDate = null
    if (student.enrollment_date && courseMonths > 0) {
      const enrollDate = new Date(student.enrollment_date)
      endDate = new Date(enrollDate.setMonth(enrollDate.getMonth() + courseMonths))
    }
    const today = new Date()
    if (student.status === "Dropped") {
      actualStatus = "Dropped"
    } else if ((student.paid_amount || 0) >= student.total_fee) {
      actualStatus = "Completed"
    } else if (endDate && today > endDate) {
      actualStatus = "Inactive"
    } else {
      actualStatus = "Active"
    }

    return actualStatus === status
  })

  generateStudentsPDF(filteredStudents, status)
}

function generateStudentsPDF(studentsList, status) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(59, 130, 246)
  doc.text(`Students Report - ${status === "all" ? "All Students" : status}`, 105, 25, { align: "center" })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: "center" })

  const tableData = studentsList.map((student) => {
    // Calculate actual status
    let actualStatus = student.status
    const course = courses.find((c) => c.name === student.course)
    let courseMonths = 0
    if (course && course.duration) {
      const match = course.duration.match(/(\d+)/)
      if (match) courseMonths = Number.parseInt(match[1], 10)
    }
    let endDate = null
    if (student.enrollment_date && courseMonths > 0) {
      const enrollDate = new Date(student.enrollment_date)
      endDate = new Date(enrollDate.setMonth(enrollDate.getMonth() + courseMonths))
    }
    const today = new Date()
    if (student.status === "Dropped") {
      actualStatus = "Dropped"
    } else if ((student.paid_amount || 0) >= student.total_fee) {
      actualStatus = "Completed"
    } else if (endDate && today > endDate) {
      actualStatus = "Inactive"
    } else {
      actualStatus = "Active"
    }

    return [
      student.name,
      student.branch || "N/A",
      student.course,
      new Date(student.enrollment_date).toLocaleDateString(),
      `₹${student.total_fee}`,
      `₹${student.paid_amount || 0}`,
      `₹${student.total_fee - (student.paid_amount || 0)}`,
      actualStatus,
    ]
  })

  doc.autoTable({
    startY: 45,
    head: [["Name", "Branch", "Course", "Enrollment", "Total Fee", "Paid", "Balance", "Status"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  })

  doc.save(`students-${status.toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`)
  showToast(`Students report downloaded successfully!`, "success")
}

window.markAsDropped = (studentId) => {
  if (confirm("Are you sure you want to mark this student as dropped? This action cannot be undone.")) {
    updateStudentStatus(studentId, "Dropped")
  }
}

window.markAsUndropped = (studentId) => {
  if (confirm("Are you sure you want to mark this student as active again?")) {
    updateStudentStatus(studentId, "Active")
  }
}

async function updateStudentStatus(studentId, status) {
  try {
    showLoading(true)
    const response = await apiCall(`/students/${studentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: status }),
    })
    if (response.success) {
      showToast(`Student marked as ${status.toLowerCase()} successfully!`, "success")
      loadStudents()
      loadDashboardData()
    } else {
      showToast(response.message || "Error updating student status", "error")
    }
  } catch (error) {
    console.error("Error updating student status:", error)
    showToast("Error updating student status", "error")
  } finally {
    showLoading(false)
  }
}

// Update download buttons visibility based on status filter
function updateDownloadButtons() {
  const statusFilter = document.getElementById("statusFilter")?.value || "all"

  // Hide all download buttons first
  document.getElementById("downloadActiveStudents").style.display = "none"
  document.getElementById("downloadInactiveStudents").style.display = "none"
  document.getElementById("downloadCompletedStudents").style.display = "none"
  document.getElementById("downloadDroppedStudents").style.display = "none"

  // Show relevant button based on filter
  if (statusFilter !== "all") {
    document.getElementById(`download${statusFilter}Students`).style.display = "inline-block"
  }
}

// Add CSS classes for capitalize and font-mono
const style = document.createElement("style")
style.textContent = `
    .capitalize { text-transform: capitalize; }
    .font-mono { font-family: 'Courier New', monospace; }
`
document.head.appendChild(style)

