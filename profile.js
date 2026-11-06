const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

const displayNameInput = document.getElementById("display_name");
const profileImageInput = document.getElementById("profile_image");
const bioInput = document.getElementById("bio");

const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const profileInitials = document.getElementById("profileInitials");
const profileAvatar = document.getElementById("profileAvatar");
// Financial Preferences
const priorityForm = document.getElementById("priorityForm");
const prioritySelect = document.getElementById("financialPriority");
const priorityMessage = document.getElementById("priorityMessage");

function updateProfilePreview() {
    const name = displayNameInput.value.trim();
    const bio = bioInput.value.trim();

    previewName.textContent = name || "Your Display Name";
    previewBio.textContent = bio || "Your bio will appear here.";

    profileInitials.textContent = name
        ? name.charAt(0).toUpperCase()
        : "?";
}

// Update preview while typing
displayNameInput.addEventListener("input", updateProfilePreview);
bioInput.addEventListener("input", updateProfilePreview);

// Load profile from MySQL through the backend
async function loadProfile() {
    try {
        const response = await fetch("/api/profile");

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load profile");
        }

        const profile = await response.json();

        document.getElementById("firstName").textContent =
            profile.first_name || "Not provided";

        document.getElementById("lastName").textContent =
            profile.last_name || "Not provided";

        document.getElementById("email").textContent =
            profile.email || "Not provided";

        displayNameInput.value = profile.display_name || "";
        profileImageInput.value = profile.profile_image || "";
        bioInput.value = profile.bio || "";
        
        // Load saved financial priority
        prioritySelect.value = profile.financial_priority || "balanced";


        updateProfilePreview();

    } catch (error) {
        console.error(error);
        profileMessage.textContent = "Unable to load profile.";
    }
}

// Save changes to MySQL through the backend
profileForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    profileMessage.textContent = "Saving...";

    try {
        const response = await fetch("/api/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                display_name: displayNameInput.value.trim(),
                profile_image: profileImageInput.value.trim(),
                bio: bioInput.value.trim()
            })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to save profile");
        }

        profileMessage.textContent = "Profile saved successfully!";
        updateProfilePreview();

    } catch (error) {
        console.error(error);
        profileMessage.textContent = "Unable to save profile.";
    }
});
// Save financial preference to MySQL
priorityForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    priorityMessage.textContent = "Saving...";

    try {
        const response = await fetch("/api/profile/priority", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                financial_priority: prioritySelect.value
            })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to save preference");
        }

        priorityMessage.textContent = "Financial preference saved successfully!";
        priorityMessage.style.color = "green";

    } catch (error) {
        console.error(error);
        priorityMessage.textContent = "Unable to save financial preference.";
        priorityMessage.style.color = "red";
    }
});

// Load saved information when opening the page
loadProfile();
