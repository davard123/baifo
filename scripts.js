const API_BASES = (() => {
    if (window.location.protocol === "file:") {
        return ["http://127.0.0.1:8080"];
    }

    const hostname = window.location.hostname || "127.0.0.1";
    return [...new Set(["/api", `${window.location.protocol}//${hostname}:8080`])];
})();
const DEFAULT_WISH =
    "愿以此功德。庄严佛净土。上报四重恩。下济三途苦。若有见闻者。悉发菩提心。尽此一报身。同生极乐国。愿消三障诸烦恼，愿得智慧真明了，普愿罪障悉消除，世世常行菩萨道。";

async function apiFetch(path, options) {
    let lastError = null;

    for (const base of API_BASES) {
        try {
            const response = await fetch(`${base}${path}`, options);
            if (response.ok) {
                return response;
            }

            if (response.status !== 404) {
                return response;
            }
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("接口服务暂时不可用。");
}

function appendImage(buttonId, selector, imagePaths) {
    const button = document.getElementById(buttonId);
    const container = document.querySelector(selector);

    if (!button || !container) {
        return;
    }

    button.addEventListener("click", () => {
        imagePaths.forEach((path) => {
            const img = document.createElement("img");
            img.src = path;
            img.alt = "";
            container.appendChild(img);
        });

        button.disabled = true;
    });
}

function renderUsers(users) {
    const tbody = document.getElementById("users-tbody");
    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.age}</td>
            <td>${user.wish}</td>
        `;
        tbody.appendChild(row);
    });
}

async function loadUsers() {
    const tbody = document.getElementById("users-tbody");
    if (!tbody) {
        return;
    }

    const emptyHint = document.getElementById("users-empty");

    try {
        const response = await apiFetch("/get_all_submitted");
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const users = await response.json();
        renderUsers(users);

        if (emptyHint) {
            emptyHint.hidden = users.length > 0;
        }
    } catch (error) {
        console.error("加载用户数据失败：", error);
        if (emptyHint) {
            emptyHint.hidden = false;
            emptyHint.textContent = "暂时无法读取用户数据，请确认 8080 接口服务已启动。";
        }
    }
}

function setupWishField() {
    const wishField = document.getElementById("wish");
    if (!wishField) {
        return;
    }

    if (!wishField.value.trim()) {
        wishField.value = DEFAULT_WISH;
    }
}

function setupForm() {
    const form = document.getElementById("user-form");
    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username")?.value.trim() || "";
        const age = document.getElementById("age")?.value.trim() || "";
        const wish = document.getElementById("wish")?.value.trim() || "";
        const submitButton =
            form.querySelector('button[type="submit"]') ||
            document.getElementById("get-submitted-data");

        if (!username || !age || !wish) {
            alert("请把用户名、年龄和愿望填写完整。");
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response = await apiFetch("/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    age,
                    wish,
                }),
            });

            const result = await response.json();

            if (!response.ok || result.status !== "success") {
                throw new Error(result.message || "提交失败");
            }

            window.location.href = "index.html";
        } catch (error) {
            console.error("提交失败：", error);
            alert(error.message || "提交失败，请稍后重试。");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    appendImage("flower-button", ".flowers1", ["04-1.png"]);
    appendImage("flower-button", ".flowers2", ["04-2.png"]);
    appendImage("gift-button", ".gifts", ["02.gif"]);
    appendImage("light-button", ".light1", ["lz.png"]);
    appendImage("light-button", ".light2", ["lz.png"]);
    appendImage("incense-button", ".incense", ["04.gif"]);
    appendImage("bow-button", ".men", ["05-1.gif"]);
    appendImage("bow-button", ".women", ["05-2.gif"]);

    setupWishField();
    setupForm();
    loadUsers();
});
