
# Step 1: Get .pfx

Export cert (e.g. Mac Keyring) as .p12 and convert to .pfx


# Step 2: .pfx to .pvk and .spc

This procedure extracts your key file and converts it to a PVK file, then extracts your certs file and converts it to an SPC file. Then you can use these files with other software tools.

At the command prompt, type and enter the following, and then press Enter. Replace inf.pfx with your exported PFX file name and outf.pem with the desired PEM file name. Enter your PFX password when prompted:

    openssl pkcs12 -in inf.pfx -nocerts -nodes -out outf.pem

At the command prompt, type and enter the following, and then press Enter. Replace inf.pem with the PEM file name created in Step 1 and outf.pvk with the desired PVK file name:

    pvk -in inf.pem -topvk -out outf.pvk

At the command prompt, type and enter the following, and then press Enter. Replace inf.pfx with your exported PFX file name and outf.pem with the desired PEM file name. Enter your PFX password when prompted:

    openssl pkcs12 -in inf.pfx -nokeys -out outf.pem

At the command prompt, type and enter the following, and then press Enter. Replace inf.pem with the PEM file created in Step 3 and outf.spc with the desired SPC file name.

    openssl crl2pkcs7 -nocrl -certfile inf.pem -outform DER -out outf.spc

