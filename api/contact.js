  document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const loading = form.querySelector(".loading");
  const errorMessage = form.querySelector(".error-message");
  const successMessage = form.querySelector(".sent-message");

  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default page refresh
    e.stopPropagation(); // Stop bubbling just in case

    loading.style.display = "block";
    errorMessage.style.display = "none";
    successMessage.style.display = "none";

    try {
      // Get reCAPTCHA token
      const token = await grecaptcha.execute("YOUR_SITE_KEY", { action: "submit" });

      const formData = new FormData(form);

      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        subject: formData.get("subject"),
        message: formData.get("message"),
        "recaptcha-token": token,
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      loading.style.display = "none";

      if (!response.ok) throw new Error(result.error || "Something went wrong");

      successMessage.style.display = "block";
      form.reset();

    } catch (err) {
      loading.style.display = "none";
      errorMessage.innerText = err.message;
      errorMessage.style.display = "block";
    }

    return false; // Extra safety to prevent refresh
  });
});