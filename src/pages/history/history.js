import { scrollTo } from "../../api/utils";
import { BlurAnimationPageChange } from "../../components/AnimationsWrappers";
import ROUTES from "../../router/routes";
import authConfigStore from "../../zstore/authConfigStore";

const History = () => {
  document.title = "History";
  scrollTo("main-content", { top: 0, behavior: "instant" });
  const user = authConfigStore((state) => state.user);

  if (!user) {
    alert("Please Login To Access This Page!");
    window.location = ROUTES.LOGIN;
    return;
  }

  return <BlurAnimationPageChange>
    <section className="p-[30px]">
    </section>
  </BlurAnimationPageChange>;
};
export default History;
