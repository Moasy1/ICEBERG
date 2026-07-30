document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;

    // Convert button to submit type to trigger submit event properly
    const submitBtn = form.querySelector('button');
    if (submitBtn && submitBtn.type !== 'submit') {
        submitBtn.type = 'submit';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        // Collect all inputs dynamically
        const inputs = form.querySelectorAll('input, textarea, select');
        let name = '';
        let email = '';
        let phone = '';
        let company = 'Service Page Form';
        let messageParts = [];

        // Extract page title as context
        const pageTitle = document.title || 'Service Page';
        messageParts.push(`Form submitted from page: ${pageTitle}\n`);

        inputs.forEach(input => {
            // Skip the submit button itself
            if (input.type === 'submit' || input.type === 'button') return;

            const labelElement = input.previousElementSibling;
            let labelText = labelElement ? labelElement.textContent.trim() : '';
            
            // Fallback to placeholder or name attribute if label is empty
            if (!labelText) {
                labelText = input.placeholder || input.name || 'Field';
            }

            const val = input.value.trim();

            // Try to map standard fields
            const lowerLabel = labelText.toLowerCase();
            const isEmail = input.type === 'email' || lowerLabel.includes('email');
            const isName = lowerLabel.includes('name');
            const isPhone = input.type === 'tel' || lowerLabel.includes('phone') || lowerLabel.includes('mobile');
            
            if (isName && !name) {
                name = val;
            } else if (isEmail && !email) {
                email = val;
            } else if (isPhone && !phone) {
                phone = val;
            } else {
                // Append other fields (like website, goals, challenges) to the message text
                messageParts.push(`${labelText}: ${val}`);
            }
        });

        const message = messageParts.join('\n');

        const formData = {
            name: name || 'Anonymous',
            email: email || 'no-email@provided.com',
            message: message || 'No message text provided.',
            phone: phone,
            company: `${pageTitle}`
        };

        try {
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            const notification = document.createElement('div');
            if (result.success) {
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
                notification.textContent = result.message || "Thank you! We'll get back to you soon.";
                form.reset();
            } else {
                notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
                notification.textContent = result.error || "Failed to submit.";
            }
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        } catch (error) {
            console.error('Error submitting form:', error);
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
            notification.textContent = 'Failed to send message. Please try again.';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
});
