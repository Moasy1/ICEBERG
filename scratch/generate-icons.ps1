Add-Type -AssemblyName System.Drawing

$logoPath = "c:\Users\hmanm\Downloads\ICEBERG\public\LOGO (2).png"
$logo = [System.Drawing.Image]::FromFile($logoPath)

function Create-Icon([int]$size, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 2, 6, 23))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    $pad = [int]($size * 0.12)
    $destW = $size - (2 * $pad)
    $destH = [int]($destW * ($logo.Height / $logo.Width))
    if ($destH -gt ($size - (2 * $pad))) {
        $destH = $size - (2 * $pad)
        $destW = [int]($destH * ($logo.Width / $logo.Height))
    }
    $destX = [int](($size - $destW) / 2)
    $destY = [int](($size - $destH) / 2)

    $g.DrawImage($logo, $destX, $destY, $destW, $destH)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Create-Icon 16 "c:\Users\hmanm\Downloads\ICEBERG\public\favicon-16x16.png"
Create-Icon 32 "c:\Users\hmanm\Downloads\ICEBERG\public\favicon-32x32.png"
Create-Icon 180 "c:\Users\hmanm\Downloads\ICEBERG\public\apple-touch-icon.png"
Create-Icon 32 "c:\Users\hmanm\Downloads\ICEBERG\public\favicon.ico"

# Create 1200x630 Open Graph Image
$ogBmp = New-Object System.Drawing.Bitmap(1200, 630)
$ogG = [System.Drawing.Graphics]::FromImage($ogBmp)
$ogG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$ogG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ogG.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background gradient
$gradRect = New-Object System.Drawing.Rectangle(0, 0, 1200, 630)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($gradRect, [System.Drawing.Color]::FromArgb(255, 2, 6, 23), [System.Drawing.Color]::FromArgb(255, 10, 25, 47), 45.0)
$ogG.FillRectangle($brush, $gradRect)

# Cyan subtle aura
$auraBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 6, 182, 212))
$ogG.FillEllipse($auraBrush, 120, 50, 450, 450)

# Draw Logo on the left
$logoW = 320
$logoH = [int]($logoW * ($logo.Height / $logo.Width))
$ogG.DrawImage($logo, 100, 75, $logoW, $logoH)

# Draw Texts on the right
$titleFont = New-Object System.Drawing.Font("Arial", 36, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
$tagFont = New-Object System.Drawing.Font("Arial", 15, [System.Drawing.FontStyle]::Regular)
$urlFont = New-Object System.Drawing.Font("Arial", 15, [System.Drawing.FontStyle]::Bold)

$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 156, 163, 175))

$ogG.DrawString("ICEBERG AGENCY", $titleFont, $whiteBrush, 480, 150)
$ogG.DrawString("DEPTH DRIVES GROWTH", $subFont, $cyanBrush, 480, 220)
$ogG.DrawString("Premier Digital Marketing, Web Development, SEO", $tagFont, $grayBrush, 480, 280)
$ogG.DrawString("and Performance Scale in Egypt & MENA.", $tagFont, $grayBrush, 480, 310)

$badgeRect = New-Object System.Drawing.Rectangle(480, 370, 250, 46)
$badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 56, 189, 248))
$ogG.FillRectangle($badgeBrush, $badgeRect)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 2)
$ogG.DrawRectangle($pen, $badgeRect)
$ogG.DrawString("https://icebergma.com", $urlFont, $cyanBrush, 495, 382)

$ogG.Dispose()
$ogBmp.Save("c:\Users\hmanm\Downloads\ICEBERG\public\assets\og-iceberg-preview.png", [System.Drawing.Imaging.ImageFormat]::Png)
$ogBmp.Dispose()
$logo.Dispose()

Write-Host "All icons and OG preview generated successfully."
