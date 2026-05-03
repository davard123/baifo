document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("users-tbody");
    const emptyHint = document.getElementById("users-empty");
    const apiBases =
        window.location.protocol === "file:"
            ? ["http://127.0.0.1:8080"]
            : [...new Set(["/api", `${window.location.protocol}//${window.location.hostname || "127.0.0.1"}:8080"])];

    if (!tbody) {
        return;
    }

    try {
        let response = null;

        for (const base of apiBases) {
            try {
                response = await fetch(`${base}/get_all_submitted`);
                if (response.ok || response.status !== 404) {
                    break;
                }
            } catch (error) {
                response = null;
            }
        }

        if (!response) {
            throw new Error("接口服务暂时不可用。");
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const users = await response.json();
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

        if (emptyHint) {
            emptyHint.hidden = users.length > 0;
        }
    } catch (error) {
        console.error("读取用户数据失败：", error);
        if (emptyHint) {
            emptyHint.hidden = false;
            emptyHint.textContent = "暂时无法读取用户数据，请确认接口服务已经启动。";
        }
    }
});
