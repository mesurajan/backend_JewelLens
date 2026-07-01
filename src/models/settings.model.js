import mongoose from "mongoose";

const themeSchema = new mongoose.Schema(
  {
    admin: {
      backgroundColor: { type: String, default: "#130B09" },
      cardColor: { type: String, default: "#22140F" },
      textColor: { type: String, default: "#F0E9DC" },
      mutedTextColor: { type: String, default: "#A79988" },
      primaryColor: { type: String, default: "#C8A15A" },
      accentColor: { type: String, default: "#D6AE62" },
      borderColor: { type: String, default: "#4A372B" },
      sidebarColor: { type: String, default: "#100907" },
    },
    storefront: {
      backgroundColor: { type: String, default: "#120A08" },
      cardColor: { type: String, default: "#1F1511" },
      textColor: { type: String, default: "#F0E9DC" },
      mutedTextColor: { type: String, default: "#A79988" },
      primaryColor: { type: String, default: "#C8A15A" },
      accentColor: { type: String, default: "#D6AE62" },
      borderColor: { type: String, default: "#4A372B" },
      heroOverlayColor: { type: String, default: "#000000" },
    },
    typography: {
      headingFont: { type: String, default: "Playfair Display" },
      bodyFont: { type: String, default: "Inter" },
      letterSpacing: { type: String, default: "normal" },
      fontScale: { type: String, default: "normal" },
    },
    components: {
      borderRadius: { type: String, default: "medium" },
      buttonStyle: { type: String, default: "rounded" },
      cardStyle: { type: String, default: "bordered" },
      shadowIntensity: { type: String, default: "soft" },
    },
    branding: {
      logoUrl: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
      brandName: { type: String, default: "JewelLens" },
      tagline: { type: String, default: "Luxury jewelry crafted for timeless elegance." },
    },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true, trim: true, default: "JewelLens" },
    storeEmail: { type: String, required: true, trim: true, lowercase: true, default: "contact@jewellens.com" },
    storeLogo: { type: String, trim: true, default: "" },
    currency: { type: String, required: true, trim: true, default: "USD" },
    taxRate: { type: Number, min: 0, default: 8.5 },
    freeShippingThreshold: { type: Number, min: 0, default: 500 },
    emailNotifications: { type: Boolean, default: true },
    orderConfirmationEmails: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    theme: { type: themeSchema, default: () => ({}) },
    navbar: {
      brand: {
        name: { type: String, default: "JewelLens" },
        logoUrl: { type: String, default: "" },
        collapsedLogoUrl: { type: String, default: "" },
        showLogo: { type: Boolean, default: true },
        showBrandName: { type: Boolean, default: true },
      },
      header: {
        eyebrow: { type: String, default: "Control Center" },
        title: { type: String, default: "auto" },
        subtitle: { type: String, default: "" },
        showNotifications: { type: Boolean, default: true },
        fixedHeader: { type: Boolean, default: true },
        stickySidebar: { type: Boolean, default: true },
      },
      links: {
        type: [
          {
            id: { type: String, required: true },
            label: { type: String, required: true },
            path: { type: String, required: true },
            icon: { type: String, default: "LayoutDashboard" },
            order: { type: Number, default: 0 },
            isVisible: { type: Boolean, default: true },
            isExternal: { type: Boolean, default: false },
            openInNewTab: { type: Boolean, default: false },
            roles: { type: [String], default: ["admin"] },
          },
        ],
        default: undefined,
      },
      style: {
        sidebarBackground: { type: String, default: "#100907" },
        headerBackground: { type: String, default: "#1B0F0C" },
        brandTextColor: { type: String, default: "#D6AE62" },
        linkTextColor: { type: String, default: "#CFC2B3" },
        activeLinkTextColor: { type: String, default: "#F0E9DC" },
        activeLinkBackground: { type: String, default: "#5A3518" },
        iconColor: { type: String, default: "#D6AE62" },
        borderColor: { type: String, default: "#4A372B" },
        hoverBackground: { type: String, default: "#2D1E18" },
        radius: { type: String, default: "1rem" },
        sidebarWidth: { type: String, default: "15rem" },
        headerHeight: { type: String, default: "4rem" },
      },
      mobile: {
        collapseMode: { type: String, default: "drawer" },
        showBottomNav: { type: Boolean, default: false },
        showBrandOnMobile: { type: Boolean, default: true },
      },
    },
    publicNavbar: {
      brand: {
        name: { type: String, default: "JewelLens" },
        logoUrl: { type: String, default: "" },
        showLogo: { type: Boolean, default: true },
        showBrandName: { type: Boolean, default: true },
      },
      links: {
        type: [
          {
            id: { type: String, required: true },
            label: { type: String, required: true },
            path: { type: String, required: true },
            order: { type: Number, default: 0 },
            isVisible: { type: Boolean, default: true },
            isExternal: { type: Boolean, default: false },
            openInNewTab: { type: Boolean, default: false },
          },
        ],
        default: undefined,
      },
      actions: {
        showSearch: { type: Boolean, default: false },
        showWishlist: { type: Boolean, default: true },
        showCart: { type: Boolean, default: true },
        showAuth: { type: Boolean, default: true },
        showCTA: { type: Boolean, default: false },
        ctaLabel: { type: String, default: "Shop Now" },
        ctaPath: { type: String, default: "/collections" },
      },
      style: {
        backgroundColor: { type: String, default: "#130B09" },
        scrolledBackgroundColor: { type: String, default: "#18100D" },
        textColor: { type: String, default: "#F0E9DC" },
        mutedTextColor: { type: String, default: "#B8AB9A" },
        activeTextColor: { type: String, default: "#D6AE62" },
        hoverTextColor: { type: String, default: "#D6AE62" },
        accentColor: { type: String, default: "#D6AE62" },
        borderColor: { type: String, default: "#4A372B" },
        iconColor: { type: String, default: "#F0E9DC" },
        height: { type: String, default: "5rem" },
        borderRadius: { type: String, default: "0rem" },
        blurEnabled: { type: Boolean, default: true },
        shadowEnabled: { type: Boolean, default: false },
      },
      mobile: {
        menuType: { type: String, default: "dropdown" },
        showBrandInMenu: { type: Boolean, default: true },
        showActionsInMenu: { type: Boolean, default: true },
      },
      typography: {
        brandFont: { type: String, default: "Playfair Display" },
        linkFont: { type: String, default: "Inter" },
        letterSpacing: { type: String, default: "widest" },
        uppercaseLinks: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
