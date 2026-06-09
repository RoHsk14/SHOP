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
};
