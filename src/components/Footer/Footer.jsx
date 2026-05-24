import React, { useState } from "react";
import {
  AltArrowRight,
  Letter,
  MapPointFavourite,
  PhoneRounded,
  Plain,
} from "@solar-icons/react";
import { Link, Button, Input } from "@heroui/react";
import logoImage from "../../assets/images/logo.png";
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import useInputStyles from "../../hooks/useInputStyles";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();

  const footerLinks = {
    learn: [
      { name: t("footer.learn.findTutors"), href: "/tutors" },
      { name: t("footer.learn.browseCourses"), href: "/courses" },
      { name: t("footer.learn.pricing"), href: "/pricing" },
      { name: t("footer.learn.howItWorks"), href: "/how-it-works" },
    ],
    company: [
      { name: t("footer.company.about"), href: "/about" },
      { name: t("footer.company.terms"), href: "/terms" },
      { name: t("footer.company.privacy"), href: "/privacy" },
      { name: t("footer.company.policies"), href: "/policies" },
    ],
    support: [
      { name: t("footer.support.helpCenter"), href: "/help" },
      { name: t("footer.support.community"), href: "/community" },
      { name: t("footer.support.becomeATutor"), href: "/teach" },
      { name: t("footer.support.faqs"), href: "/faqs" },
    ],
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      console.log("Subscribed:", email);
      setEmail("");
    }
  };

  // Animated Link Component
  const AnimatedLink = ({ href, children, badge }) => (
    <Link
      href={href}
      className="group text-base inline-flex items-center gap-1.5 transition-all duration-200"
      style={{ color: colors.text.secondary }}
    >
      <AltArrowRight weight="BoldDuotone"
        className="w-0 h-4 opacity-0 -ml-1 group-hover:w-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200"
        style={{ color: colors.primary.main }}
      />
      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
        {children}
      </span>
      {badge && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: colors.primary.main,
            color: colors.text.white,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <footer>
      {/* CTA Banner */}
      <div style={{ backgroundColor: colors.primary.main }}></div>
      {/* Main Footer */}
      <div style={{ backgroundColor: colors.background.light }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Logo */}
              <Link href="/" className="inline-flex items-center gap-2.5">
                <img
                  src={logoImage}
                  alt="EngConnect"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  className="h-12 w-auto"
                />
              </Link>

              <p
                className="text-base leading-relaxed max-w-xs"
                style={{ color: colors.text.secondary }}
              >
                {t("footer.brand.description")}
              </p>

              {/* Newsletter */}
              <div>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: colors.text.secondary, fontWeight: "600" }}
                >
                  {t("footer.newsletter.title")}
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("footer.newsletter.placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="sm"
                    radius="lg"
                    className="flex-1"
                    classNames={{
                      ...inputClassNames,
                      inputWrapper: `h-10 ${inputClassNames.inputWrapper}`,
                    }}
                    startContent={
                      <Letter
                        weight="BoldDuotone"
                        className="w-5 h-5 ml-2"
                        style={{ color: colors.text.tertiary }}
                      />
                    }
                  />
                  <Button
                    type="submit"
                    size="sm"
                    radius="lg"
                    isIconOnly
                    className="h-10 w-10"
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.white,
                    }}
                  >
                    <Plain weight="BoldDuotone" className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(footerLinks).map(([title, links]) => (
                  <div key={title}>
                    <h4
                      className="text-sm font-bold uppercase tracking-wider mb-4 pb-2 relative inline-block"
                      style={{ color: colors.text.primary }}
                    >
                      {title}
                      <span
                        className="absolute bottom-0 left-0 h-0.5 w-1/2"
                        style={{ backgroundColor: colors.primary.main }}
                      />
                    </h4>
                    <ul className="space-y-2.5">
                      {links.map((link) => (
                        <li key={link.name}>
                          <AnimatedLink href={link.href} badge={link.badge}>
                            {link.name}
                          </AnimatedLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Column */}
            <div className="lg:col-span-3">
              {/* Contact Information */}
              <div>
                <p
                  className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 relative inline-block"
                  style={{ color: colors.text.primary }}
                >
                  {t("footer.contact.title")}
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-1/2"
                    style={{ backgroundColor: colors.primary.main }}
                  />
                </p>
                <div className="flex flex-wrap gap-6">
                  {/* Email */}
                  <a
                    href="mailto:hello@engconnect.com"
                    className="flex items-center gap-2 text-sm hover:underline transition-colors"
                    style={{ color: colors.text.secondary }}
                  >
                    <Letter
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.primary.main }}
                    />
                    <span>hello@engconnect.com</span>
                  </a>

                  {/* Hotline */}
                  <a
                    href="tel:+84123456789"
                    className="flex items-center gap-2 text-sm hover:underline transition-colors"
                    style={{ color: colors.text.secondary }}
                  >
                    <PhoneRounded
                      weight="BoldDuotone"
                      className="w-4 h-4"
                      style={{ color: colors.primary.main }}
                    />
                    <span>+84 834 102 996</span>
                  </a>

                  {/* Address */}
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    <MapPointFavourite
                      weight="BoldDuotone"
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: colors.primary.main }}
                    />
                    <span>7Đ. D1, Long Thạnh Mỹ, Thủ Đức, TP.HCM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="border-t"
        style={{
          borderColor: colors.border.light,
          backgroundColor: colors.background.gray,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              © {new Date().getFullYear()} EngConnect.{" "}
              {t("footer.bottom.rights")}
            </p>

            <div className="flex items-center gap-4">
              {[
                { key: "privacy", label: t("footer.bottom.privacy") },
                { key: "terms", label: t("footer.bottom.terms") },
                { key: "policies", label: t("footer.bottom.policies") },
              ].map((item) => (
                <Link
                  key={item.key}
                  href={`/${item.key}`}
                  className="text-xs transition-colors duration-200 hover:underline"
                  style={{ color: colors.text.secondary }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs"
                style={{ color: colors.text.secondary }}
              >
                🇻🇳
              </span>
              <span
                className="text-xs"
                style={{ color: colors.text.secondary }}
              >
                {t("footer.bottom.madeIn")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
