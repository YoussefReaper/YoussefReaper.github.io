// Utility script to initialize and fetch profile data
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile bootstrapper running...');
    
    // Check for remiProfiles in localStorage
    const profiles = localStorage.getItem('remiProfiles');
    
    if (profiles) {
        console.log('Found profile data:', profiles);
        const parsedProfiles = JSON.parse(profiles);
        
        // Extract user data for quick access
        if (parsedProfiles.user) {
            if (parsedProfiles.user.name) {
                localStorage.setItem('userName', parsedProfiles.user.name);
                console.log('Set userName:', parsedProfiles.user.name);
            }
            
            if (parsedProfiles.user.picture) {
                localStorage.setItem('userProfileImage', parsedProfiles.user.picture);
                console.log('Set userProfileImage:', parsedProfiles.user.picture);
            }
        }
    } else {
        // Load fallback user
        console.log('No profiles found, using defaults');
        if (!localStorage.getItem('userName')) {
            localStorage.setItem('userName', 'Auro User');
        }
        
        // Try to use Shinobu as default if no profile picture set
        if (!localStorage.getItem('userProfileImage')) {
            localStorage.setItem('userProfileImage', 'pfp/Shinobu-Sticker.png');
        }
    }
    
    // Update UI elements with user information
    let username = localStorage.getItem('userName') || 'Auro User';
    let userImage = localStorage.getItem('userProfileImage');
    
    console.log('Final profile data for UI:', { username, userImage });
    
    // Update username in topbar
    const usernameElements = document.querySelectorAll('#topbar-username');
    usernameElements.forEach(element => {
        if (element) {
            element.textContent = username;
        }
    });
    
    // Update profile avatar in topbar
    const profilePicElements = document.querySelectorAll('#topbar-profile-pic');
    profilePicElements.forEach(element => {
        if (element) {
            if (userImage) {
                // If we have an image, create and insert img element
                element.innerHTML = `<img src="${userImage}" alt="${username}" />`;
                element.classList.add('has-image');
            } else {
                // Otherwise just show the initial
                const initial = username.charAt(0).toUpperCase();
                element.textContent = initial;
                element.classList.remove('has-image');
            }
        }
    });
});
