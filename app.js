
(() => {
    "use strict";

    const app = document.getElementById("app");

    if (!app) {
        document.body.innerHTML =
            "<h2>Website error</h2><p>Missing element with id='app'. Check index.html.</p>";
        return;
    }

    const roles = ["Admin", "Registrar", "Dean", "Instructor", "Student"];

    const pages = [
        ["dashboard", "Dashboard", "⌂"],
        ["course", "Course", "▤"],
        ["term", "Term", "▦"],
        ["instructors", "Instructors", "♙"],
        ["subjects", "Subjects", "▣"],
        ["yearlevel", "Year Level", "▤"],
        ["section", "Section", "♧"],
        ["schoolyear", "School Year", "▦"],
        ["users", "Users", "♙"],
        ["usertype", "User Type", "⚙"],
        ["picture", "Profile", "◉"]
    ];

    const access = {
        Admin: [
            "dashboard", "course", "term", "instructors", "subjects",
            "yearlevel", "section", "schoolyear", "users", "usertype",
            "picture"
        ],
        Registrar: [
            "dashboard", "term", "instructors", "subjects",
            "schoolyear", "picture"
        ],
        Dean: [
            "dashboard", "subjects", "section", "instructors",
            "yearlevel", "picture"
        ],
        Instructor: [
            "dashboard", "subjects", "section", "picture"
        ],
        Student: [
            "dashboard", "subjects", "picture"
        ]
    };

    const defaults = {
        course: [
            {
                id: 1,
                name: "BSIS",
                description: "Bachelor of Science in Information Systems"
            }
        ],
        term: [
            { id: 1, name: "1ST SEMESTER", description: "First semester" },
            { id: 2, name: "2ND SEMESTER", description: "Second semester" }
        ],
        yearlevel: [
            { id: 1, name: "1ST YEAR", description: "First year" },
            { id: 2, name: "2ND YEAR", description: "Second year" },
            { id: 3, name: "3RD YEAR", description: "Third year" },
            { id: 4, name: "4TH YEAR", description: "Fourth year" }
        ],
        section: [
            { id: 1, name: "A", description: "Section A" },
            { id: 2, name: "B", description: "Section B" }
        ],
        schoolyear: [
            {
                id: 1,
                name: "2026-2027",
                description: "Academic year 2026-2027"
            }
        ],
        subjects: [
            {
                id: 1,
                name: "Introduction to Information Systems",
                code: "IS101",
                course: "BSIS",
                year: "1ST YEAR",
                term: "1ST SEMESTER",
                lecture: 3,
                laboratory: 0,
                credit: 3
            }
        ],
        instructors: [
            {
                id: 1,
                name: "Sample Instructor",
                salutation: "Mr.",
                middlename: "",
                photo: ""
            }
        ],
        users: [],
        usertype: roles.map((name, index) => ({
            id: index + 1,
            name
        }))
    };

    const demos = [
        { username: "admin", password: "admin12345", role: "Admin" },
        { username: "registrar", password: "reg12345", role: "Registrar" },
        { username: "dean", password: "dean12345", role: "Dean" },
        { username: "instructor", password: "teach12345", role: "Instructor" },
        { username: "student", password: "stud12345", role: "Student" }
    ];

    function read(key, fallback) {
        try {
            const value = localStorage.getItem("sis_" + key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            console.error("Could not read saved data:", key, error);
            return fallback;
        }
    }

    function save(key, value) {
        try {
            localStorage.setItem("sis_" + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Could not save data:", key, error);
            alert("Could not save data. Browser storage may be full.");
            return false;
        }
    }

    Object.keys(defaults).forEach(key => {
        if (localStorage.getItem("sis_" + key) === null) {
            save(key, defaults[key]);
        }
    });

    if (localStorage.getItem("sis_users") === null) {
        save(
            "users",
            demos.map((user, index) => ({
                id: index + 1,
                ...user,
                photo: ""
            }))
        );
    }

    let current = null;

    try {
        current = JSON.parse(
            sessionStorage.getItem("sis_session") || "null"
        );
    } catch (error) {
        sessionStorage.removeItem("sis_session");
    }

    if (current && !roles.includes(current.role)) {
        current = null;
        sessionStorage.removeItem("sis_session");
    }

    let active = "dashboard";
    let editing = null;
    let notice = "";

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

    const records = key => read(key, defaults[key] || []);

    const label = key =>
        pages.find(page => page[0] === key)?.[1] || key;

    function login() {
        app.innerHTML = `
            <main class="login-wrap">
                <section class="login-card">
                    <div class="login-brand">4BSAMONTE</div>
                    <p class="muted">Student Information System</p>
                    <h2>Sign in</h2>

                    <form id="loginForm">
                        <label>Username</label>
                        <input name="username" required autocomplete="username">

                        <label>Password</label>
                        <input name="password" type="password" required
                            autocomplete="current-password">

                        <label>User type</label>
                        <select name="role">
                            ${roles.map(role =>
                                `<option value="${role}">${role}</option>`
                            ).join("")}
                        </select>

                        <p id="loginError" class="error"></p>
                        <button class="primary wide" type="submit">Login</button>
                    </form>

                    <details>
                        <summary>Demo accounts</summary>
                        <p>Admin: admin / admin12345</p>
                        <p>Registrar: registrar / reg12345</p>
                        <p>Dean: dean / dean12345</p>
                        <p>Instructor: instructor / teach12345</p>
                        <p>Student: student / stud12345</p>
                    </details>

                    <p class="small muted">
                        Demo version: data is stored in this browser only.
                    </p>
                </section>
            </main>
        `;

        document.getElementById("loginForm").onsubmit = event => {
            event.preventDefault();

            const form = new FormData(event.target);
            const username = String(form.get("username")).trim();
            const password = String(form.get("password"));
            const role = String(form.get("role"));

            const found = records("users").find(user =>
                user.username === username &&
                user.password === password &&
                user.role === role
            );

            if (!found) {
                document.getElementById("loginError").textContent =
                    "Invalid username, password, or user type.";
                return;
            }

            current = {
                username: found.username,
                role: found.role,
                photo: found.photo || ""
            };

            sessionStorage.setItem(
                "sis_session",
                JSON.stringify(current)
            );

            active = "dashboard";
            editing = null;
            notice = "";
            render();
        };
    }

    function render() {
        if (!current) {
            login();
            return;
        }

        const allowed = access[current.role] || [];

        if (!allowed.includes(active)) {
            active = "dashboard";
        }

        app.innerHTML = `
            <aside class="sidebar">
                <div class="logo">
                    <h2>4BSAMONTE</h2>
                    <p>Student Information System</p>
                </div>

                <nav class="menu">
                    ${pages
                        .filter(page => allowed.includes(page[0]))
                        .map(page => `
                            <a href="#${page[0]}" data-page="${page[0]}"
                                class="${active === page[0] ? "active" : ""}">
                                <span class="menu-icon">${page[2]}</span>
                                ${page[1]}
                            </a>
                        `).join("")}

                    <a href="#logout" id="logout" class="logout-link">
                        <span class="menu-icon">↪</span>Logout
                    </a>
                </nav>

                <div class="sidebar-user">
                    ${current.photo
                        ? `<img src="${current.photo}" alt="Profile">`
                        : ""}
                    <div>
                        <strong>${esc(current.username)}</strong>
                        <small>${esc(current.role)}</small>
                    </div>
                </div>
            </aside>

            <main class="main-content">
                <header class="topbar">
                    <div>
                        <span class="eyebrow">STUDENT INFORMATION SYSTEM</span>
                        <h1>${label(active)}</h1>
                    </div>

                    <div class="user-pill">
                        ${current.photo
                            ? `<img src="${current.photo}" alt="Profile">`
                            : ""}
                        <span>
                            ${esc(current.username)}
                            <small>${esc(current.role)}</small>
                        </span>
                    </div>
                </header>

                <section class="page-content">
                    ${notice ? `<div class="notice">${esc(notice)}</div>` : ""}
                    ${pageContent()}
                </section>
            </main>
        `;

        app.querySelectorAll("[data-page]").forEach(link => {
            link.onclick = event => {
                event.preventDefault();
                active = link.dataset.page;
                editing = null;
                notice = "";
                render();
            };
        });

        app.querySelectorAll(".quick-link[data-page]").forEach(button => {
            button.onclick = () => {
                active = button.dataset.page;
                editing = null;
                notice = "";
                render();
            };
        });

        document.getElementById("logout").onclick = event => {
            event.preventDefault();
            current = null;
            sessionStorage.removeItem("sis_session");
            active = "dashboard";
            editing = null;
            notice = "";
            render();
        };

        const form = document.getElementById("recordForm");
        if (form) form.onsubmit = saveRecord;

        const cancel = document.getElementById("cancelEdit");
        if (cancel) {
            cancel.onclick = () => {
                editing = null;
                render();
            };
        }

        const search = document.getElementById("searchBox");
        if (search) {
            search.oninput = () => filterRows(search.value);
        }

        const photoInput = document.getElementById("photoInput");

        if (photoInput) {
            photoInput.onchange = () => {
                const file = photoInput.files[0];
                if (!file) return;

                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    alert("Please select a JPG, PNG, or WEBP image.");
                    photoInput.value = "";
                    return;
                }

                if (file.size > 3 * 1024 * 1024) {
                    alert("Image must be 3 MB or smaller.");
                    photoInput.value = "";
                    return;
                }

                const reader = new FileReader();

                reader.onload = () => {
                    current.photo = reader.result;

                    const users = records("users");
                    const user = users.find(
                        item => item.username === current.username
                    );

                    if (user) {
                        user.photo = reader.result;

                        if (!save("users", users)) return;
                    }

                    sessionStorage.setItem(
                        "sis_session",
                        JSON.stringify(current)
                    );

                    render();
                };

                reader.onerror = () => {
                    alert("Could not read the selected image.");
                };

                reader.readAsDataURL(file);
            };
        }

        app.querySelectorAll("[data-edit]").forEach(button => {
            button.onclick = () => {
                editing = Number(button.dataset.edit);
                render();
            };
        });

        app.querySelectorAll("[data-delete]").forEach(button => {
            button.onclick = () => {
                if (!confirm("Delete this record?")) return;

                const key = active;
                const rows = records(key).filter(
                    item => item.id !== Number(button.dataset.delete)
                );

                if (!save(key, rows)) return;

                editing = null;
                notice = "Record deleted.";
                render();
            };
        });
    }

    function pageContent() {
        if (active === "dashboard") {
            const stats = ["course", "subjects", "instructors", "users"]
                .map(key => `
                    <article class="stat-card">
                        <span>${label(key)}</span>
                        <strong>${records(key).length}</strong>
                    </article>
                `).join("");

            const links = (access[current.role] || [])
                .filter(key => key !== "dashboard")
                .map(key => `
                    <button type="button" class="quick-link" data-page="${key}">
                        ${label(key)} <span>→</span>
                    </button>
                `).join("");

            return `
                <div class="welcome-panel">
                    <div>
                        <p class="eyebrow">WELCOME BACK</p>
                        <h2>Hello, ${esc(current.username)}!</h2>
                        <p>Manage academic information from your dashboard.</p>
                    </div>
                    <div class="welcome-symbol">✦</div>
                </div>

                <div class="stats-grid">${stats}</div>

                <article class="panel">
                    <h3>Quick access</h3>
                    <div class="quick-links">${links}</div>
                </article>
            `;
        }

        if (active === "picture") {
            const preview = current.photo
                ? `<img src="${current.photo}" alt="Profile photo">`
                : "<span>◉</span>";

            return `
                <article class="panel form-panel">
                    <h2>Profile picture</h2>
                    <p class="muted">Choose a JPG, PNG, or WEBP image up to 3 MB.</p>
                    <div class="profile-preview">${preview}</div>
                    <label>Upload image</label>
                    <input type="file" id="photoInput"
                        accept="image/jpeg,image/png,image/webp">
                    <p class="small muted">
                        The image is stored in this browser for this demo.
                    </p>
                </article>
            `;
        }

        const key = active;
        const rows = records(key);
        const isSubjects = key === "subjects";
        const isUsers = key === "users";
        const isInstructors = key === "instructors";
        const isTypes = key === "usertype";

        const canEdit =
            current.role === "Admin" ||
            (key === "term" && current.role === "Registrar") ||
            (key === "subjects" &&
                ["Registrar", "Dean", "Instructor"].includes(current.role)) ||
            (key === "section" &&
                ["Dean", "Instructor"].includes(current.role)) ||
            (key === "yearlevel" && current.role === "Dean") ||
            (key === "schoolyear" && current.role === "Registrar");

        const fields = isUsers
            ? [["username", "Username"], ["password", "Password"], ["role", "User type"]]
            : isSubjects
                ? [
                    ["code", "Subject code"],
                    ["name", "Subject title"],
                    ["course", "Course"],
                    ["year", "Year level"],
                    ["term", "Term"],
                    ["lecture", "Lecture units"],
                    ["laboratory", "Laboratory units"],
                    ["credit", "Credit"]
                ]
                : isInstructors
                    ? [
                        ["salutation", "Salutation"],
                        ["name", "First name / Full name"],
                        ["middlename", "Middle name"]
                    ]
                    : isTypes
                        ? [["name", "User type"]]
                        : [
                            ["name", ({
                                course: "Course",
                                term: "Term",
                                yearlevel: "Year level",
                                section: "Section",
                                schoolyear: "School year"
                            })[key] || "Name"],
                            ["description", "Description"]
                        ];

        const edit = editing === null
            ? null
            : rows.find(row => row.id === editing);

        const headers = isUsers
            ? ["ID", "Username", "User type"]
            : isSubjects
                ? ["ID", "Code", "Subject title", "Course", "Year", "Term", "Credit"]
                : isInstructors
                    ? ["ID", "Name", "Salutation", "Middle name"]
                    : isTypes
                        ? ["ID", "User type"]
                        : ["ID", "Name", "Description"];

        const headHtml = headers.map(item => `<th>${item}</th>`).join("") +
            (canEdit ? "<th>Actions</th>" : "");

        const rowHtml = rows.map(row => {
            let cells;

            if (isUsers) {
                cells = `
                    <td>${row.id}</td>
                    <td>${esc(row.username)}</td>
                    <td>${esc(row.role)}</td>
                `;
            } else if (isSubjects) {
                cells = `
                    <td>${row.id}</td>
                    <td>${esc(row.code)}</td>
                    <td>${esc(row.name)}</td>
                    <td>${esc(row.course)}</td>
                    <td>${esc(row.year)}</td>
                    <td>${esc(row.term)}</td>
                    <td>${esc(row.credit)}</td>
                `;
            } else if (isInstructors) {
                cells = `
                    <td>${row.id}</td>
                    <td>
                        ${row.photo
                            ? `<img class="table-avatar" src="${row.photo}" alt="">`
                            : ""}
                        ${esc(row.name)}
                    </td>
                    <td>${esc(row.salutation)}</td>
                    <td>${esc(row.middlename)}</td>
                `;
            } else if (isTypes) {
                cells = `<td>${row.id}</td><td>${esc(row.name)}</td>`;
            } else {
                cells = `
                    <td>${row.id}</td>
                    <td>${esc(row.name)}</td>
                    <td>${esc(row.description)}</td>
                `;
            }

            const actions = canEdit
                ? `
                    <td class="actions">
                        <button type="button" class="small-button"
                            data-edit="${row.id}">Edit</button>
                        <button type="button" class="small-button danger"
                            data-delete="${row.id}">Delete</button>
                    </td>
                `
                : "";

            return `
                <tr data-search="${esc(
                    Object.values(row).join(" ").toLowerCase()
                )}">
                    ${cells}${actions}
                </tr>
            `;
        }).join("") || `
            <tr>
                <td colspan="8" class="empty">No records yet.</td>
            </tr>
        `;

        const formFields = fields.map(([name, title]) => {
            let control;

            if (name === "role") {
                control = `
                    <select name="${name}" required>
                        ${roles.map(role => `
                            <option value="${role}"
                                ${edit && edit[name] === role ? "selected" : ""}>
                                ${role}
                            </option>
                        `).join("")}
                    </select>
                `;
            } else if (["course", "year", "term"].includes(name)) {
                const source = name === "course"
                    ? "course"
                    : name === "year"
                        ? "yearlevel"
                        : "term";

                const options = records(source).map(item => `
                    <option value="${esc(item.name)}"
                        ${edit && edit[name] === item.name ? "selected" : ""}>
                        ${esc(item.name)}
                    </option>
                `).join("");

                control = `<select name="${name}">${options}</select>`;
            } else {
                const numeric = ["lecture", "laboratory", "credit"].includes(name);
                const type = numeric ? 'type="number" min="0"' : 'type="text"';
                const required = name === "description" ? "" : "required";
                const value = edit ? edit[name] ?? "" : "";

                control = `
                    <input name="${name}" ${type}
                        value="${esc(value)}" ${required}>
                `;
            }

            return `<label>${title}</label>${control}`;
        }).join("");

        const formHtml = canEdit ? `
            <article class="panel form-panel">
                <h2>${edit ? "Edit" : "Add"} ${label(key).replace(/s$/, "")}</h2>

                <form id="recordForm" data-key="${key}"
                    data-id="${edit ? edit.id : ""}">
                    ${formFields}

                    <div class="form-actions">
                        <button class="primary" type="submit">
                            ${edit ? "Save changes" : "Add record"}
                        </button>

                        ${edit
                            ? '<button type="button" id="cancelEdit" class="secondary">Cancel</button>'
                            : ""}
                    </div>

                    <p class="small muted">
                        Changes are saved in browser storage, not a shared database.
                    </p>
                </form>
            </article>
        ` : "";

        return `
            <div class="content-grid">
                <article class="panel table-panel">
                    <div class="panel-heading">
                        <div>
                            <h2>${label(key)} list</h2>
                            <p class="muted">
                                ${rows.length} record${rows.length === 1 ? "" : "s"} available
                            </p>
                        </div>
                        <input id="searchBox" class="search-box"
                            placeholder="Search records...">
                    </div>

                    <div class="table-wrap">
                        <table id="recordsTable">
                            <thead><tr>${headHtml}</tr></thead>
                            <tbody>${rowHtml}</tbody>
                        </table>
                    </div>
                </article>

                ${formHtml}
            </div>
        `;
    }

    function saveRecord(event) {
        event.preventDefault();

        const form = event.target;
        const key = form.dataset.key;
        const id = Number(form.dataset.id) || null;
        const data = Object.fromEntries(new FormData(form).entries());

        ["lecture", "laboratory", "credit"].forEach(name => {
            if (data[name] !== undefined) {
                data[name] = Number(data[name]) || 0;
            }
        });

        const rows = records(key);

        if (key === "users") {
            if (!data.username || !data.password) return;

            if (!roles.includes(data.role)) {
                alert("Select a valid user type.");
                return;
            }

            if (rows.some(row =>
                row.username === data.username && row.id !== id
            )) {
                alert("Username already exists.");
                return;
            }
        }

        if (id) {
            const updated = rows.map(row =>
                row.id === id ? { ...row, ...data, id } : row
            );

            if (!save(key, updated)) return;
            notice = "Record updated.";
        } else {
            data.id = Math.max(
                0,
                ...rows.map(row => Number(row.id) || 0)
            ) + 1;

            if (key === "instructors") data.photo = "";

            rows.push(data);

            if (!save(key, rows)) return;
            notice = "Record added.";
        }

        editing = null;
        render();
    }

    function filterRows(query) {
        document.querySelectorAll(
            "#recordsTable tbody tr[data-search]"
        ).forEach(row => {
            row.hidden = !row.dataset.search.includes(
                query.toLowerCase()
            );
        });
    }

    function boot() {
        try {
            render();
        } catch (error) {
            console.error("Website startup error:", error);

            app.innerHTML = `
                <main style="padding:24px;font-family:Arial,sans-serif">
                    <h2>Unable to load the website</h2>
                    <p>A JavaScript error stopped the page from loading.</p>
                    <p>Open your browser console with F12 and check the Console tab.</p>
                    <pre style="white-space:pre-wrap">${esc(error.stack || error.message)}</pre>
                    <button onclick="location.reload()">Reload page</button>
                </main>
            `;
        }
    }

    boot();
})();
