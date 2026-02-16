(() => {
    "use strict";

// --- 1. PRELOADER ---
const preloader = document.querySelector("#preloader"); // Must match HTML ID
if (preloader) {
    window.addEventListener("load", () => {
        // Step 1: Add fade-out class
        preloader.classList.add("fade-out");
        
        // Step 2: Remove from DOM after transition finishes
        setTimeout(() => {
            preloader.style.display = "none";
        }, 800); 
    });
}

    // --- 2. BOOTSTRAP FORM VALIDATION ---
    const forms = document.querySelectorAll(".needs-validation");
    Array.from(forms).forEach((form) => {
        form.addEventListener("submit", (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add("was-validated");
        }, false);
    });

    // --- 3. TOAST NOTIFICATIONS (Flash Messages) ---
    document.addEventListener('DOMContentLoaded', () => {
        const toastTrigger = document.getElementById('liveToastBtn');
        const toastLiveExample = document.getElementById('liveToast');

        if (toastTrigger && toastLiveExample) {
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
            toastTrigger.addEventListener('click', () => {
                toastBootstrap.show();
            });

            if (toastTrigger.dataset.autoShow === 'true' || toastTrigger.style.display === 'none') {
                toastTrigger.click();
            }
        }
    });

    // --- 4. PASSWORD VISIBILITY TOGGLE ---
    const togglePasswords = document.querySelectorAll('.passwordToggler');
    togglePasswords.forEach((toggle) => {
        toggle.addEventListener('click', function (e) {
            const isConfirm = e.target.classList.contains('cnf-passkey');
            const passwordInput = document.querySelector(isConfirm ? 'input[name="cnfPassword"]' : 'input[name="password"]');
            
            if (passwordInput) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            }
        });
    });

    // --- 5. BACK TO TOP BUTTON ---
    const backToTop = document.querySelector(".goto-top");
    if (backToTop) {
        const handleScroll = () => {
            window.scrollY > 400 ? backToTop.style.display = "flex" : backToTop.style.display = "none";
        };
        window.addEventListener("load", handleScroll);
        window.addEventListener("scroll", handleScroll);
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // --- 6. FEEDBACK POPUP ---
    const feedbackForm = document.querySelector(".feedback-popup");
    const feedbackContainer = document.querySelector(".feedback-container");
    const submitFeedback = document.querySelector("#feedback");
    const closeForm = document.querySelector("#close-button");
    const reviewForm = document.querySelector("#review-form");

    if (submitFeedback && feedbackForm) {
        submitFeedback.addEventListener("click", () => {
            if (feedbackContainer) feedbackContainer.classList.remove("fade-out");
            feedbackForm.style.display = "flex";
        });
    }

    if (closeForm && feedbackForm) {
        closeForm.addEventListener("click", (event) => {
            event.preventDefault();
            if (feedbackContainer) feedbackContainer.classList.add("fade-out");
            if (reviewForm) reviewForm.reset();
            setTimeout(() => {
                feedbackForm.style.display = "none";
            }, 200);
        });
    }

    // --- 7. LISTING TAGS LIMIT (MAX 3) ---
    const tagCheckboxes = document.querySelectorAll('.tag-checkbox');
    const tagAlert = document.querySelector('.tag-alert');
    if (tagCheckboxes.length > 0) {
        const maxAllowedTags = 3;
        tagCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('.tag-checkbox:checked').length;
                if (checkedCount > maxAllowedTags) {
                    checkbox.checked = false;
                    if (tagAlert) {
                        tagAlert.classList.remove("normal-tag-alert");
                        tagAlert.classList.add("red-tag-alert");
                    }
                } else if (tagAlert) {
                    tagAlert.classList.remove("red-tag-alert");
                    tagAlert.classList.add("normal-tag-alert");
                }
            });
        });
    }

    // --- 8. FILE UPLOAD LIMIT (MAX 4) ---
    const listingImageInput = document.getElementById('fileInput');
    const fileError = document.getElementById('fileError');
    if (listingImageInput && fileError) {
        const maxFiles = 4;
        listingImageInput.addEventListener('change', function () {
            if (this.files.length > maxFiles) {
                fileError.classList.replace("nomal-error", "alert-error");
                this.value = ''; // Reset selection
            } else {
                fileError.classList.replace("alert-error", "nomal-error");
            }
        });
    }

    // --- 9. DESCRIPTION CHARACTER LIMIT (Unified & Safe) ---
    const descInput = document.querySelector("#list-description");
    const desError = document.querySelector("#des-error");
    if (descInput && desError) {
        const maxChars = 1000;
        descInput.addEventListener("input", function () {
            if (this.value.length > maxChars) {
                this.value = this.value.substring(0, maxChars);
                desError.textContent = "You have reached the 1000-character limit!";
                desError.classList.add("alert-error");
            } else {
                desError.textContent = `Maximum ${maxChars} characters!`;
                desError.classList.remove("alert-error");
            }
        });
    }
})();

/**
 * Geolocation logic (Kept outside IIFE so navbar onclick can find it)
 */
function getNearbyListings() {
    const nearbyBtn = document.querySelector('.nearby-btn');
    if (!nearbyBtn) return;

    const originalIcon = nearbyBtn.innerHTML;
    nearbyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                window.location.href = `/listing/nearby?lng=${longitude}&lat=${latitude}`;
            },
            (error) => {
                nearbyBtn.innerHTML = originalIcon;
                alert("Please enable location services to find nearby properties.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        nearbyBtn.innerHTML = originalIcon;
    }
}

// Function to handle likes without refresh
async function likeBlog(blogId) {
    const likeCountSpan = document.getElementById(`likes-${blogId}`);
    
    try {
        const response = await fetch(`/blogs/${blogId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            // Update only the specific like count in the DOM
            likeCountSpan.textContent = data.likes;
            
            // Optional: Add a small animation effect
            likeCountSpan.parentElement.classList.add('animate-heart');
            setTimeout(() => likeCountSpan.parentElement.classList.remove('animate-heart'), 300);
        } else {
            console.error("Server error while liking:", data.message);
        }
    } catch (err) {
        console.error("AJAX Error:", err);
    }
}