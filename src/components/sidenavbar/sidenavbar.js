import { NavLink } from "react-router-dom";
import Logo from "../../assets/logo/logo.png";
import {
  AddToQueueSvg,
  ArtistsSvg,
  HomeSvg,
  MenuSvg,
  PlaylistsSvg,
  ReleasesSvg,
  SearchSvg,
} from "../../assets/svg";
import ROUTES from "../../router/routes";
import styles from "./sidenavbar.module.css";
import authConfigStore from "../../zstore/authConfigStore";
import MusicPlayer from "../musicplayer/musicplayer";
import playerStore from "../../zstore/playerStore";
import sidebarStore from "../../zstore/sidebarStore";
import { useEffect } from "react";

const QueueNavbarTab = () => {
  const queue = playerStore((state) => state.queue);

  if (queue.length)
    return (
      <NavLink className={styles.NavbarTab} to="/queue">
        <AddToQueueSvg className="w-[22px] h-[22px]" />
        <span>
          Manage Queue <span className="text-green-500">•</span>
        </span>
      </NavLink>
    );
  return null;
};

const NavbarTab = ({ to, Icon, children }) => {
  return (
    <NavLink className={styles.NavbarTab} to={to}>
      <Icon className="w-[22px] h-[22px]" />
      <span>{children}</span>
    </NavLink>
  );
};

const SidebarOverlay = ({ open, toggleSidebar }) => {
  const shouldShow = window.innerWidth <= 1200 && open;

  return shouldShow ? (
    <div
      className="absolute top-0 left-0 w-screen h-[100dvh] inset-0 bg-[#16151A]/75 z-10"
      onClick={toggleSidebar}
    />
  ) : null;
};

const SideNavbar = () => {
  const user = authConfigStore((state) => state.user);
  const open = sidebarStore((state) => state.open);
  const setOpen = sidebarStore((state) => state.setOpen);

  const toggleSidebar = () => {
    setOpen(!open);
  };

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth > 1200);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setOpen]);

  return (
    <>
      <SidebarOverlay open={open} toggleSidebar={toggleSidebar} />
      <div
        className={`bg-[#16151A] h-[100dvh] flex-shrink-0 overflow-hidden transition-[width] duration-300 absolute top-0 left-0 z-10 2lg:static ${
          open ? "w-[260px] border-[#222227] border-r" : "w-0"
        }`}
        id="sidebar"
      >
        <div className="w-[260px] h-[100dvh] flex flex-col">
          <div className="flex-shrink-0 border-[#222227] border-b h-[70px] px-[30px] flex items-center justify-between">
            <img src={Logo} alt="logo" className="h-6" />
            <span
              className="ml-2 text-xl mt-1 font-sans cursor-pointer"
              onClick={toggleSidebar}
            >
              <MenuSvg
                className={`w-6 h-6 ${
                  open ? "stroke-[#25a56a]" : "stroke-white"
                }`}
              />
            </span>
          </div>
          <div className="flex-grow overflow-y-auto p-[30px] flex flex-col gap-5">
            <NavbarTab to={ROUTES.HOME} Icon={HomeSvg}>
              Home
            </NavbarTab>
            <NavbarTab to={"search"} Icon={SearchSvg}>
              Search
            </NavbarTab>
            <NavbarTab to={"artists"} Icon={ArtistsSvg}>
              Artists
            </NavbarTab>
            <NavbarTab to={"albums"} Icon={ReleasesSvg}>
              Albums
            </NavbarTab>
            <QueueNavbarTab />
            {user && (
              <NavbarTab to={ROUTES.YOURLIBRARY} Icon={PlaylistsSvg}>
                Your Library
              </NavbarTab>
            )}
          </div>
          <MusicPlayer />
        </div>
      </div>
    </>
  );
};

export default SideNavbar;
