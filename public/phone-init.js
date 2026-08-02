// public/phone-init.js - Automatically initializes intl-tel-input with flag & dial code on all phone fields
(function () {
    window.initPhoneInputs = function (targetContainer) {
        if (!window.intlTelInput) return;
        const container = targetContainer || document;
        const inputs = container.querySelectorAll('input[type="tel"]');
        inputs.forEach(input => {
            if (input.dataset.itiInitialized) return;
            input.dataset.itiInitialized = "true";

            try {
                const iti = window.intlTelInput(input, {
                    initialCountry: "eg", // Default country so flag is displayed immediately
                    preferredCountries: ["eg", "sa", "ae", "us", "gb"],
                    separateDialCode: true,
                    geoIpLookup: function (success, failure) {
                        fetch("https://ipapi.co/json/")
                            .then(res => res.json())
                            .then(data => success(data.country_code ? data.country_code.toLowerCase() : "eg"))
                            .catch(() => success("eg"));
                    },
                    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js"
                });
                input._iti = iti;
            } catch (e) {
                console.error("Phone input init error:", e);
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.initPhoneInputs());
    } else {
        window.initPhoneInputs();
    }
})();
