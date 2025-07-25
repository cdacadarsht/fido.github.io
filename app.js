// function base64ToUint8Array(base64String) {
//     const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
//     const base64 = (base64String + padding)
//         .replace(/-/g, '+')
//         .replace(/_/g, '/');
//     const rawData = window.atob(base64);
//     const outputArray = new Uint8Array(rawData.length);
//     for (let i = 0; i < rawData.length; ++i) {
//         outputArray[i] = rawData.charCodeAt(i);
//     }
//     return outputArray;
// }

// function arrayBufferToBase64(buffer) {
//     let binary = '';
//     const bytes = new Uint8Array(buffer);
//     for (let i = 0; i < bytes.byteLength; i++) {
//         binary += String.fromCharCode(bytes[i]);
//     }
//     return window.btoa(binary);
// }

// function showLoader() {
//     document.getElementById('loader')?.classList.remove('hidden');
// }

// function hideLoader() {
//     document.getElementById('loader')?.classList.add('hidden');
// }

// function showToast(message) {
//     const toast = document.getElementById('toast');
//     if (!toast) return;
//     toast.textContent = message;
//     toast.classList.add('show');
//     setTimeout(() => {
//         toast.classList.remove('show');
//     }, 2500);
// }

// document.getElementById('register').addEventListener('click', async () => {
//     const username = document.getElementById('username').value;
//     if (!username) {
//         showToast('Please enter a username');
//         return;
//     }

//     showLoader();

//     try {
//         const response = await fetch('/generate-options', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ username })
//         });

//         let options = await response.json();
//         options.challenge = base64ToUint8Array(options.challenge);
//         options.user.id = base64ToUint8Array(btoa(options.user.id));

//         const credential = await navigator.credentials.create({ publicKey: options });
//         if (!credential) {
//             hideLoader();
//             showToast('No credential returned.');
//             return;
//         }

//         const credentialData = {
//             id: credential.id,
//             type: credential.type,
//             rawId: arrayBufferToBase64(credential.rawId),
//             response: {
//                 attestationObject: arrayBufferToBase64(credential.response.attestationObject),
//                 clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
//             }
//         };

//         localStorage.setItem('credential', JSON.stringify(credentialData));

//         hideLoader();
//         showToast('✅ Registration successful!');
//     } catch (error) {
//         console.error(error);
//         hideLoader();
//         showToast('Error during registration');
//     }
// });

// document.getElementById('authenticate').addEventListener('click', async () => {
//     const username = document.getElementById('username').value;
//     if (!username) {
//         showToast('Please enter a username');
//         return;
//     }

//     const credentialStr = localStorage.getItem('credential');
//     if (!credentialStr) {
//         showToast('No credential stored. Please register first.');
//         return;
//     }

//     showLoader();

//     try {
//         const credential = JSON.parse(credentialStr);

//         const challengeResponse = await fetch('/generate-options', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ username })
//         });

//         let options = await challengeResponse.json();
//         options.challenge = base64ToUint8Array(options.challenge);
//         options.allowCredentials = [{
//             id: base64ToUint8Array(credential.rawId),
//             type: 'public-key',
//             transports: ['usb','nfc','ble','internal']
//         }];

//         const assertion = await navigator.credentials.get({ publicKey: options });
//         if (!assertion) {
//             hideLoader();
//             showToast('Authentication cancelled or failed.');
//             return;
//         }

//         hideLoader();
//         showToast('✅ Authentication successful!');
//         // Send assertion to server for verification (if needed)
//     } catch (error) {
//         console.error(error);
//         hideLoader();
//         showToast('Error during authentication');
//     }
// });

// // Dark mode toggle
// document.getElementById('darkToggle').addEventListener('change', () => {
//     document.body.classList.toggle('dark-mode');
// });
function base64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleLoader(show) {
    document.getElementById('loader').classList.toggle('hidden', !show);
}

document.getElementById('register').addEventListener('click', async () => {
    try {
        const username = document.getElementById('username').value;
        if (!username) {
            showToast('Please enter a username');
            return;
        }

        toggleLoader(true);
        const response = await fetch('/generate-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        let options = await response.json();
        options.challenge = base64ToUint8Array(options.challenge);
        options.user.id = base64ToUint8Array(btoa(options.user.id));

        const credential = await navigator.credentials.create({ publicKey: options });
        if (!credential) {
            showToast('No credential returned from authenticator');
            toggleLoader(false);
            return;
        }

        const credentialData = {
            id: credential.id,
            type: credential.type,
            rawId: arrayBufferToBase64(credential.rawId),
            response: {
                attestationObject: arrayBufferToBase64(credential.response.attestationObject),
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON)
            }
        };
        localStorage.setItem('credential', JSON.stringify(credentialData));
        showToast('✅ Registration successful');
    } catch (error) {
        console.error(error);
        showToast('❌ Registration error: ' + error);
    } finally {
        toggleLoader(false);
    }
});

document.getElementById('authenticate').addEventListener('click', async () => {
    try {
        const credentialStr = localStorage.getItem('credential');
        if (!credentialStr) {
            showToast('Please register first');
            return;
        }

        toggleLoader(true);
        const username = document.getElementById('username').value;
        const challengeResponse = await fetch('/generate-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        let options = await challengeResponse.json();
        options.challenge = base64ToUint8Array(options.challenge);

        const credential = JSON.parse(credentialStr);
        options.allowCredentials = [{
            id: base64ToUint8Array(credential.rawId),
            type: 'public-key',
            transports: ['usb', 'nfc', 'ble', 'internal']
        }];

        const assertion = await navigator.credentials.get({ publicKey: options });
        if (!assertion) {
            showToast('Authentication cancelled or failed');
            toggleLoader(false);
            return;
        }

        showToast('✅ Authentication successful');
        // You may send the assertion object to your backend for further verification here
    } catch (error) {
        console.error(error);
        showToast('❌ Authentication error: ' + error);
    } finally {
        toggleLoader(false);
    }
});

document.getElementById('darkToggle').addEventListener('change', function () {
    document.body.classList.toggle('dark-mode');
});
