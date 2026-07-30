// public/phone-init.js - Automatically initializes intl-tel-input with auto country detection on all phone fields
(function () {
    function initPhoneInputs() {
        if (!window.intlTelInput) return;
        const inputs = document.querySelectorAll('input[type="tel"]');
        inputs.forEach(input => {
            if (input.dataset.itiInitialized) return;
            input.dataset.itiInitialized = "true";

            const iti = window.intlTelInput(input, {
                initialCountry: "auto",
                geoIpLookup: function (success, failure) {
                    fetch("https://ipapi.co/json/")
                        .then(res => res.json())
                        .then(data => success(data.country_code))
                        .catch(() => success("eg"));
                },
                utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js"
            });
            input._iti = iti;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPhoneInputs);
    } else {
        initPhoneInputs();
    }
})();
