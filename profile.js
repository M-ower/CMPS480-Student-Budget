
const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

const displayNameInput = document.getElementById("display_name");
const bioInput = document.getElementById("bio");

const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const profileInitials = document.getElementById("profileInitials");

function updateProfilePreview() {
    const name = displayNameInput.value.trim();
    const bio = bioInput.value.trim();

    previewName.textContent = name || "Your Display Name";
    previewBio.textContent = bio || "Your bio will appear here.";

    profileInitials.textContent = name
        ? name.charAt(0).toUpperCase()
        : "?";
}

displayNameInput.addEventListener("input", updateProfilePreview);
bioInput.addEventListener("input", updateProfilePreview);

profileForm.addEventListener("submit", function(event) {
    event.preventDefault();

    profileMessage.textContent =
        "Profile saving will be available after database integration.";
});

updateProfilePreview();
