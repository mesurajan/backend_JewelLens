import Settings from "../models/settings.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const defaultTheme = {
  admin: {
    backgroundColor: "#130B09",
    cardColor: "#22140F",
    textColor: "#F0E9DC",
    mutedTextColor: "#A79988",
    primaryColor: "#C8A15A",
    accentColor: "#D6AE62",
    borderColor: "#4A372B",
    sidebarColor: "#100907",
  },
  storefront: {
    backgroundColor: "#120A08",
    cardColor: "#1F1511",
    textColor: "#F0E9DC",
    mutedTextColor: "#A79988",
    primaryColor: "#C8A15A",
    accentColor: "#D6AE62",
    borderColor: "#4A372B",
    heroOverlayColor: "#000000",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    letterSpacing: "normal",
    fontScale: "normal",
  },
  components: {
    borderRadius: "medium",
    buttonStyle: "rounded",
    cardStyle: "bordered",
    shadowIntensity: "soft",
  },
  branding: {
    logoUrl: "",
    faviconUrl: "",
    brandName: "JewelLens",
    tagline: "Luxury jewelry crafted for timeless elegance.",
  },
};

const defaultNavbarLinks = [
  { id: "dashboard", label: "Dashboard", path: "/admin", icon: "LayoutDashboard", order: 1, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "customers", label: "Customers Details", path: "/admin/customers", icon: "Users", order: 2, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "homepage", label: "Homepage Details", path: "/admin/homepage", icon: "Home", order: 3, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "products", label: "Products Details", path: "/admin/products", icon: "Package", order: 4, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "categories", label: "Categories List", path: "/admin/categories", icon: "FolderOpen", order: 5, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "orders", label: "Orders List", path: "/admin/orders", icon: "ShoppingCart", order: 6, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "reviews", label: "Review Details", path: "/admin/reviews", icon: "Star", order: 7, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "testimonials", label: "Testimonials", path: "/admin/testimonials", icon: "Quote", order: 8, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "messages", label: "Messages", path: "/admin/messages", icon: "MessageSquare", order: 9, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "coupons", label: "Coupons", path: "/admin/coupons", icon: "Tag", order: 10, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
  { id: "settings", label: "Settings", path: "/admin/settings", icon: "Settings", order: 11, isVisible: true, isExternal: false, openInNewTab: false, roles: ["admin"] },
];

const defaultNavbar = {
  brand: { name: "JewelLens", logoUrl: "", collapsedLogoUrl: "", showLogo: true, showBrandName: true },
  header: { eyebrow: "Control Center", title: "auto", subtitle: "", showNotifications: true, fixedHeader: true, stickySidebar: true },
  links: defaultNavbarLinks,
  style: {
    sidebarBackground: "#100907",
    headerBackground: "#1B0F0C",
    brandTextColor: "#D6AE62",
    linkTextColor: "#CFC2B3",
    activeLinkTextColor: "#F0E9DC",
    activeLinkBackground: "#5A3518",
    iconColor: "#D6AE62",
    borderColor: "#4A372B",
    hoverBackground: "#2D1E18",
    radius: "1rem",
    sidebarWidth: "15rem",
    headerHeight: "4rem",
  },
  mobile: { collapseMode: "drawer", showBottomNav: false, showBrandOnMobile: true },
};

const defaultPublicNavbarLinks = [
  { id: "home", label: "Home", path: "/", order: 1, isVisible: true, isExternal: false, openInNewTab: false },
  { id: "collections", label: "Collections", path: "/collections", order: 2, isVisible: true, isExternal: false, openInNewTab: false },
  { id: "about", label: "About", path: "/about", order: 3, isVisible: true, isExternal: false, openInNewTab: false },
  { id: "contact", label: "Contact", path: "/contact", order: 4, isVisible: true, isExternal: false, openInNewTab: false },
];

const defaultPublicNavbar = {
  brand: { name: "JewelLens", logoUrl: "", showLogo: true, showBrandName: true },
  links: defaultPublicNavbarLinks,
  actions: { showSearch: false, showWishlist: true, showCart: true, showAuth: true, showCTA: false, ctaLabel: "Shop Now", ctaPath: "/collections" },
  style: {
    backgroundColor: "#130B09",
    scrolledBackgroundColor: "#18100D",
    textColor: "#F0E9DC",
    mutedTextColor: "#B8AB9A",
    activeTextColor: "#D6AE62",
    hoverTextColor: "#D6AE62",
    accentColor: "#D6AE62",
    borderColor: "#4A372B",
    iconColor: "#F0E9DC",
    height: "5rem",
    borderRadius: "0rem",
    blurEnabled: true,
    shadowEnabled: false,
  },
  mobile: { menuType: "dropdown", showBrandInMenu: true, showActionsInMenu: true },
  typography: { brandFont: "Playfair Display", linkFont: "Inter", letterSpacing: "widest", uppercaseLinks: true },
};

const defaults = {
  storeName: "JewelLens",
  storeEmail: "contact@jewellens.com",
  storeLogo: "",
  currency: "USD",
  taxRate: 8.5,
  freeShippingThreshold: 500,
  emailNotifications: true,
  orderConfirmationEmails: true,
  maintenanceMode: false,
  theme: defaultTheme,
  navbar: defaultNavbar,
  publicNavbar: defaultPublicNavbar,
};

const colorFields = new Set([
  "backgroundColor",
  "cardColor",
  "textColor",
  "mutedTextColor",
  "primaryColor",
  "accentColor",
  "borderColor",
  "sidebarColor",
  "heroOverlayColor",
]);
const navbarColorFields = new Set([
  "sidebarBackground",
  "headerBackground",
  "brandTextColor",
  "linkTextColor",
  "activeLinkTextColor",
  "activeLinkBackground",
  "iconColor",
  "borderColor",
  "hoverBackground",
]);
const publicNavbarColorFields = new Set([
  "backgroundColor",
  "scrolledBackgroundColor",
  "textColor",
  "mutedTextColor",
  "activeTextColor",
  "hoverTextColor",
  "accentColor",
  "borderColor",
  "iconColor",
]);
const hexColorRegex = /^#[0-9a-f]{6}$/i;
const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const safeText = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 300);
const safeUrl = (value) => {
  const next = String(value || "").trim();
  if (!next) return "";
  if (!/^https?:\/\/.+/i.test(next)) throw new ApiError(400, "Theme image URLs must be valid URLs");
  return next;
};

const mergeThemeWithDefaults = (theme = {}) => ({
  admin: { ...defaultTheme.admin, ...(theme.admin || {}) },
  storefront: { ...defaultTheme.storefront, ...(theme.storefront || {}) },
  typography: { ...defaultTheme.typography, ...(theme.typography || {}) },
  components: { ...defaultTheme.components, ...(theme.components || {}) },
  branding: { ...defaultTheme.branding, ...(theme.branding || {}) },
});

const mergeNavbarWithDefaults = (navbar = {}) => ({
  brand: { ...defaultNavbar.brand, ...(navbar.brand || {}) },
  header: { ...defaultNavbar.header, ...(navbar.header || {}) },
  links: Array.isArray(navbar.links) && navbar.links.length ? navbar.links : defaultNavbar.links,
  style: { ...defaultNavbar.style, ...(navbar.style || {}) },
  mobile: { ...defaultNavbar.mobile, ...(navbar.mobile || {}) },
});

const mergePublicNavbarWithDefaults = (publicNavbar = {}) => ({
  brand: { ...defaultPublicNavbar.brand, ...(publicNavbar.brand || {}) },
  links: Array.isArray(publicNavbar.links) && publicNavbar.links.length ? publicNavbar.links : defaultPublicNavbar.links,
  actions: { ...defaultPublicNavbar.actions, ...(publicNavbar.actions || {}) },
  style: { ...defaultPublicNavbar.style, ...(publicNavbar.style || {}) },
  mobile: { ...defaultPublicNavbar.mobile, ...(publicNavbar.mobile || {}) },
  typography: { ...defaultPublicNavbar.typography, ...(publicNavbar.typography || {}) },
});

const validateTheme = (theme = {}) => {
  const merged = mergeThemeWithDefaults(theme);

  for (const section of ["admin", "storefront"]) {
    for (const [key, value] of Object.entries(merged[section])) {
      if (colorFields.has(key) && !hexColorRegex.test(String(value))) {
        throw new ApiError(400, `${section}.${key} must be a valid hex color`);
      }
    }
  }

  return {
    admin: merged.admin,
    storefront: merged.storefront,
    typography: {
      headingFont: oneOf(merged.typography.headingFont, ["Playfair Display", "Cormorant Garamond", "Inter", "Poppins", "Montserrat", "Lora"], defaultTheme.typography.headingFont),
      bodyFont: oneOf(merged.typography.bodyFont, ["Inter", "Poppins", "Montserrat", "Lato", "Roboto"], defaultTheme.typography.bodyFont),
      letterSpacing: oneOf(merged.typography.letterSpacing, ["normal", "wide", "wider", "widest"], defaultTheme.typography.letterSpacing),
      fontScale: oneOf(merged.typography.fontScale, ["compact", "normal", "large", "premium"], defaultTheme.typography.fontScale),
    },
    components: {
      borderRadius: oneOf(merged.components.borderRadius, ["none", "small", "medium", "large", "full"], defaultTheme.components.borderRadius),
      buttonStyle: oneOf(merged.components.buttonStyle, ["sharp", "rounded", "pill"], defaultTheme.components.buttonStyle),
      cardStyle: oneOf(merged.components.cardStyle, ["flat", "bordered", "glass", "elevated"], defaultTheme.components.cardStyle),
      shadowIntensity: oneOf(merged.components.shadowIntensity, ["none", "soft", "medium", "strong"], defaultTheme.components.shadowIntensity),
    },
    branding: {
      logoUrl: safeUrl(merged.branding.logoUrl),
      faviconUrl: safeUrl(merged.branding.faviconUrl),
      brandName: safeText(merged.branding.brandName, defaultTheme.branding.brandName),
      tagline: safeText(merged.branding.tagline, defaultTheme.branding.tagline),
    },
  };
};

const validateNavbar = (navbar = {}) => {
  const merged = mergeNavbarWithDefaults(navbar);

  for (const [key, value] of Object.entries(merged.style)) {
    if (navbarColorFields.has(key) && !hexColorRegex.test(String(value))) {
      throw new ApiError(400, `navbar.style.${key} must be a valid hex color`);
    }
  }

  const links = merged.links.map((link, index) => {
    const id = safeText(link.id, `link-${index + 1}`).replace(/[^a-zA-Z0-9-_]/g, "") || `link-${index + 1}`;
    const label = safeText(link.label, "Admin Link");
    const path = safeText(link.path, "/admin");
    const order = Number(link.order);

    if (!label) throw new ApiError(400, "Navbar link label is required");
    if (!path || (!path.startsWith("/") && !/^https?:\/\//i.test(path))) {
      throw new ApiError(400, "Navbar link path must be an app path or URL");
    }

    return {
      id,
      label,
      path,
      icon: safeText(link.icon, "LayoutDashboard").replace(/[^a-zA-Z0-9]/g, "") || "LayoutDashboard",
      order: Number.isFinite(order) ? order : index + 1,
      isVisible: link.isVisible !== false,
      isExternal: Boolean(link.isExternal),
      openInNewTab: Boolean(link.openInNewTab),
      roles: Array.isArray(link.roles) ? link.roles.map((role) => safeText(role)).filter(Boolean) : [],
    };
  });

  return {
    brand: {
      name: safeText(merged.brand.name, defaultNavbar.brand.name),
      logoUrl: safeUrl(merged.brand.logoUrl),
      collapsedLogoUrl: safeUrl(merged.brand.collapsedLogoUrl),
      showLogo: merged.brand.showLogo !== false,
      showBrandName: merged.brand.showBrandName !== false,
    },
    header: {
      eyebrow: safeText(merged.header.eyebrow, defaultNavbar.header.eyebrow),
      title: safeText(merged.header.title, defaultNavbar.header.title),
      subtitle: safeText(merged.header.subtitle, ""),
      showNotifications: merged.header.showNotifications !== false,
      fixedHeader: merged.header.fixedHeader !== false,
      stickySidebar: merged.header.stickySidebar !== false,
    },
    links,
    style: {
      ...merged.style,
      radius: safeText(merged.style.radius, defaultNavbar.style.radius),
      sidebarWidth: safeText(merged.style.sidebarWidth, defaultNavbar.style.sidebarWidth),
      headerHeight: safeText(merged.style.headerHeight, defaultNavbar.style.headerHeight),
    },
    mobile: {
      collapseMode: oneOf(merged.mobile.collapseMode, ["drawer", "icons", "hidden"], defaultNavbar.mobile.collapseMode),
      showBottomNav: Boolean(merged.mobile.showBottomNav),
      showBrandOnMobile: merged.mobile.showBrandOnMobile !== false,
    },
  };
};

const validatePublicNavbar = (publicNavbar = {}) => {
  const merged = mergePublicNavbarWithDefaults(publicNavbar);

  for (const [key, value] of Object.entries(merged.style)) {
    if (publicNavbarColorFields.has(key) && !hexColorRegex.test(String(value))) {
      throw new ApiError(400, `publicNavbar.style.${key} must be a valid hex color`);
    }
  }

  const validatePath = (path, fallback = "/") => {
    const next = safeText(path, fallback);
    if (!next || (!next.startsWith("/") && !/^https?:\/\//i.test(next))) {
      throw new ApiError(400, "Public navbar path must be an app path or URL");
    }
    return next;
  };

  return {
    brand: {
      name: safeText(merged.brand.name, defaultPublicNavbar.brand.name),
      logoUrl: safeUrl(merged.brand.logoUrl),
      showLogo: merged.brand.showLogo !== false,
      showBrandName: merged.brand.showBrandName !== false,
    },
    links: merged.links.map((link, index) => ({
      id: safeText(link.id, `public-link-${index + 1}`).replace(/[^a-zA-Z0-9-_]/g, "") || `public-link-${index + 1}`,
      label: safeText(link.label, "Link"),
      path: validatePath(link.path, "/"),
      order: Number.isFinite(Number(link.order)) ? Number(link.order) : index + 1,
      isVisible: link.isVisible !== false,
      isExternal: Boolean(link.isExternal),
      openInNewTab: Boolean(link.openInNewTab),
    })),
    actions: {
      showSearch: Boolean(merged.actions.showSearch),
      showWishlist: merged.actions.showWishlist !== false,
      showCart: merged.actions.showCart !== false,
      showAuth: merged.actions.showAuth !== false,
      showCTA: Boolean(merged.actions.showCTA),
      ctaLabel: safeText(merged.actions.ctaLabel, defaultPublicNavbar.actions.ctaLabel),
      ctaPath: validatePath(merged.actions.ctaPath, defaultPublicNavbar.actions.ctaPath),
    },
    style: {
      ...merged.style,
      height: safeText(merged.style.height, defaultPublicNavbar.style.height),
      borderRadius: safeText(merged.style.borderRadius, defaultPublicNavbar.style.borderRadius),
      blurEnabled: Boolean(merged.style.blurEnabled),
      shadowEnabled: Boolean(merged.style.shadowEnabled),
    },
    mobile: {
      menuType: oneOf(merged.mobile.menuType, ["drawer", "dropdown", "fullscreen"], defaultPublicNavbar.mobile.menuType),
      showBrandInMenu: merged.mobile.showBrandInMenu !== false,
      showActionsInMenu: merged.mobile.showActionsInMenu !== false,
    },
    typography: {
      brandFont: oneOf(merged.typography.brandFont, ["Playfair Display", "Cormorant Garamond", "Inter", "Poppins", "Montserrat", "Lora"], defaultPublicNavbar.typography.brandFont),
      linkFont: oneOf(merged.typography.linkFont, ["Playfair Display", "Cormorant Garamond", "Inter", "Poppins", "Montserrat", "Lora"], defaultPublicNavbar.typography.linkFont),
      letterSpacing: oneOf(merged.typography.letterSpacing, ["normal", "wide", "wider", "widest"], defaultPublicNavbar.typography.letterSpacing),
      uppercaseLinks: merged.typography.uppercaseLinks !== false,
    },
  };
};

const getSingletonSettings = async () => {
  let settings = await Settings.findOne().sort({ createdAt: 1 });

  if (!settings) {
    settings = await Settings.create(defaults);
  } else if (!settings.theme || !settings.navbar || !settings.publicNavbar) {
    settings.theme = mergeThemeWithDefaults(settings.theme);
    settings.navbar = mergeNavbarWithDefaults(settings.navbar);
    settings.publicNavbar = mergePublicNavbarWithDefaults(settings.publicNavbar);
    await settings.save();
  }

  return settings;
};

const validatePayload = (payload = {}) => {
  const storeName = String(payload.storeName || "").trim();
  const storeEmail = String(payload.storeEmail || "").trim().toLowerCase();
  const storeLogo = String(payload.storeLogo || "").trim();
  const currency = String(payload.currency || "").trim().toUpperCase();
  const taxRate = Number(payload.taxRate);
  const freeShippingThreshold = Number(payload.freeShippingThreshold);
  const emailNotifications = payload.emailNotifications;
  const orderConfirmationEmails = payload.orderConfirmationEmails;
  const maintenanceMode = payload.maintenanceMode;

  if (!storeName) throw new ApiError(400, "Store name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail)) throw new ApiError(400, "Valid store email is required");
  if (storeLogo && !/^https?:\/\/.+/i.test(storeLogo)) throw new ApiError(400, "Store logo must be a valid URL");
  if (!currency) throw new ApiError(400, "Currency is required");
  if (!Number.isFinite(taxRate) || taxRate < 0) throw new ApiError(400, "Tax rate must be a number greater than or equal to 0");
  if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
    throw new ApiError(400, "Free shipping threshold must be a number greater than or equal to 0");
  }
  if (typeof emailNotifications !== "boolean") throw new ApiError(400, "Email notifications must be boolean");
  if (typeof orderConfirmationEmails !== "boolean") throw new ApiError(400, "Order confirmation emails must be boolean");
  if (typeof maintenanceMode !== "boolean") throw new ApiError(400, "Maintenance mode must be boolean");

  return {
    storeName,
    storeEmail,
    storeLogo,
    currency,
    taxRate,
    freeShippingThreshold,
    emailNotifications,
    orderConfirmationEmails,
    maintenanceMode,
    theme: validateTheme(payload.theme),
    navbar: validateNavbar(payload.navbar),
    publicNavbar: validatePublicNavbar(payload.publicNavbar),
  };
};

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await getSingletonSettings();
  settings.theme = mergeThemeWithDefaults(settings.theme);
  settings.navbar = mergeNavbarWithDefaults(settings.navbar);
  settings.publicNavbar = mergePublicNavbarWithDefaults(settings.publicNavbar);
  new ApiResponse(res, 200, "Settings fetched", settings).send();
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getSingletonSettings();
  const payload = validatePayload(req.body);

  Object.assign(settings, payload);
  await settings.save();

  new ApiResponse(res, 200, "Settings updated", settings).send();
});
