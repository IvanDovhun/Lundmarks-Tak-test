{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.chromium
    
    # === Packages for Puppeteer/Chromium ===
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.fontconfig
    pkgs.freetype
    pkgs.expat
    pkgs.dbus
    pkgs.udev
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXcursor
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXi
    pkgs.xorg.libXrandr
    pkgs.xorg.libXrender
    pkgs.xorg.libXtst
    pkgs.xorg.libXScrnSaver
    pkgs.xorg.libxcb
    pkgs.libxkbcommon
    pkgs.alsaLib
    pkgs.at-spi2-atk
    pkgs.cups
    pkgs.gdk-pixbuf
    pkgs.gtk3
    pkgs.pango
    pkgs.mesa
    pkgs.cairo
    # ======================================
  ];
}