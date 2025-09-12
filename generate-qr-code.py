#!/usr/bin/env python3
"""
Generate QR code for DPC app provisioning
"""

import json
import qrcode
from PIL import Image

# Correct provisioning payload
provisioning_payload = {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.mdm.dpc/.DeviceAdminReceiver",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://poetic-llama-889a15.netlify.app/download/mdm-dpc-app.apk",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": "f4fce84a9b1cdd6911499045752a904800360c08cc42310835364d14dfaec2db",
    "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": True,
    "android.app.extra.PROVISIONING_ENROLLMENT_TOKEN": "ATVJPGWNHLXPFZGAKIQQ"
}

# Convert to JSON string
qr_code_content = json.dumps(provisioning_payload)

print("QR Code Content:")
print(qr_code_content)
print("\n" + "="*50 + "\n")

# Generate QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

qr.add_data(qr_code_content)
qr.make(fit=True)

# Create image
img = qr.make_image(fill_color="black", back_color="white")

# Save QR code
img.save("dpc-provisioning-qr.png")
print("QR code saved as 'dpc-provisioning-qr.png'")

# Display QR code in terminal (if possible)
try:
    img.show()
    print("QR code displayed in image viewer")
except:
    print("Could not display QR code automatically")

print("\nProvisioning Instructions:")
print("1. Scan this QR code with your Android device during setup")
print("2. Or use the enrollment token: ATVJPGWNHLXPFZGAKIQQ")
print("3. The device will download and install the DPC app")
print("4. The app will become the Device Owner")
