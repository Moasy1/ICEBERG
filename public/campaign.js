// public/campaign.js
// Campaign disabled / retired
(function () {
    const ribbon = document.getElementById('campaign-urgency-ribbon');
    if (ribbon) {
        ribbon.remove();
    }
    const styles = document.getElementById('campaign-header-adjustment-styles');
    if (styles) {
        styles.remove();
    }
})();
