import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Slideshow from "./Slideshow";
import FeaturedProducts from "./FeaturedProducts";
import TextWithImage from "./TextWithImage";
import Video from "./Video";
import Newsletter from "./Newsletter";
import Footer from "./Footer";
import Spacer from "./Spacer";
import CustomHtml from "./CustomHtml";
import SectionProductSearch from "./SectionProductSearch";
import SectionProductFilters from "./SectionProductFilters";
import SectionProductGrid from "./SectionProductGrid";
import SectionProductBreadcrumbs from "./SectionProductBreadcrumbs";
import SectionProductGallery from "./SectionProductGallery";
import SectionProductInfo from "./SectionProductInfo";
import SectionProductSharing from "./SectionProductSharing";
import SectionProductStickyCart from "./SectionProductStickyCart";
import SectionProductAccordion from "./SectionProductAccordion";
import SectionProductMessaging from "./SectionProductMessaging";
import SectionBundleOffer from "./SectionBundleOffer";
import SectionThankYou from "./SectionThankYou";
import SectionWishlistPage from "./SectionWishlistPage";
import StatsBar from "./StatsBar";
import Testimonials from "./Testimonials";
import FeaturesGrid from "./FeaturesGrid";
import FAQ from "./FAQ";
import CTABanner from "./CTABanner";

export const sectionComponents: Record<string, React.ComponentType<any>> = {
  "announcement-bar": AnnouncementBar,
  header: Header,
  slideshow: Slideshow,
  "featured-products": FeaturedProducts,
  "text-with-image": TextWithImage,
  video: Video,
  newsletter: Newsletter,
  footer: Footer,
  spacer: Spacer,
  "custom-html": CustomHtml,
  "product-search": SectionProductSearch,
  "product-filters": SectionProductFilters,
  "product-grid": SectionProductGrid,
  "product-breadcrumbs": SectionProductBreadcrumbs,
  "product-gallery": SectionProductGallery,
  "product-info": SectionProductInfo,
  "product-accordion": SectionProductAccordion,
  "product-messaging": SectionProductMessaging,
  "bundle-offer": SectionBundleOffer,
  "product-sharing": SectionProductSharing,
  "product-sticky-cart": SectionProductStickyCart,
  "thank-you": SectionThankYou,
  "wishlist-page": SectionWishlistPage,
  "stats-bar": StatsBar,
  testimonials: Testimonials,
  "features-grid": FeaturesGrid,
  faq: FAQ,
  "cta-banner": CTABanner,
};
