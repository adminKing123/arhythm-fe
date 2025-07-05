import { useEffect, useRef, useState } from "react";
import tokenManager from "../../api/utils";
import { HistorySvg, MenuSvg, SearchSvg, SignSvg } from "../../assets/svg";
import ROUTES from "../../router/routes";
import authConfigStore from "../../zstore/authConfigStore";
import A, { ALink } from "../links/links";
import { useDebounce } from "use-debounce";
import { GlobalSearchContainer } from "../songcards/containers";
import pageItemsStore from "../../zstore/pageItemsStore";
import sidebarStore from "../../zstore/sidebarStore";
import { createPortal } from 'react-dom';

const Tab = ({ children }) => {
  return (
    <A className="text-[#c0c0c0] hover:no-underline hidden md:inline-block">
      {children}
    </A>
  );
};

const OptionSignLogout = ({ user }) => {
  const handleLogout = () => {
    tokenManager.removeToken();
    window.location = ROUTES.LOGIN;
  };

  return user ? (
    <A
      onClick={handleLogout}
      className="h-fit flex items-center gap-3 border-l pl-3 border-[#222227] cursor-pointer hover:no-underline"
    >
      <span className="text-nowrap text-[#c0c0c0]">Logout</span>
      <SignSvg className="fill-[#c0c0c0] w-6 h-6" />
    </A>
  ) : (
    <A
      href={ROUTES.LOGIN}
      className="h-fit flex items-center gap-3 border-l pl-3 border-[#222227] cursor-pointer hover:no-underline"
    >
      <span className="text-nowrap text-[#c0c0c0]">Sign In</span>
      <SignSvg className="fill-[#c0c0c0] w-6 h-6" />
    </A>
  );
};

const ShowLastGbSearches = ({ gbSearchHistory, clearHistory, setQ }) => {
  return (
    <div className="bg-[#16151A] border border-[#222227] rounded-xl top-2 absolute min-w-[280px] w-full max-w-[740px] pt-[70px] px-6 pb-6">
      {gbSearchHistory.length ? (
        <>
          <div className="flex justify-between items-center flex-wrap mb-3">
            <h3 className="text-lg text-white">Search Activity</h3>
            <ALink className="text-sm" onClick={clearHistory}>
              Clear All
            </ALink>
          </div>
          <ul>
            {gbSearchHistory.map((query, index) => {
              const number = (index + 1).toString().padStart(2, "0");
              return (
                <li
                  key={index}
                  onClick={() => setQ(query)}
                  className="cursor-pointer flex justify-between items-center py-1 rounded-md group"
                >
                  <div className="flex items-center gap-3">
                    <HistorySvg className="w-4 h-4 fill-white group-hover:fill-[#25a56a]" />
                    <p
                      className="truncate group-hover:text-[#25a56a]"
                      title={query}
                    >
                      {query}
                    </p>
                  </div>
                  <div>
                    <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-md bg-[#1c1c1c] group-hover:bg-[#25a56990] text-white">
                      {number}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-center">
          No recent searches found. <br />
          Start exploring by entering your query above.
        </p>
      )}
    </div>
  );
};

const SearchInput = () => {
  const [isSearching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ] = useDebounce(q, 300);
  const user = authConfigStore((state) => state.user);
  const inputRef = useRef(null);

  const [gbSearchHistory, setGbSearchHistory] = useState(() => {
    const storedHistory = localStorage.getItem("gbSearchHistory");
    return storedHistory ? JSON.parse(storedHistory) : [];
  });

  const saveHistory = (query) => {
    if (!query.trim()) return;
    setGbSearchHistory((prevHistory) => {
      const updatedHistory = [...new Set([query, ...prevHistory])].slice(0, 10); // Keep the latest 10 unique queries
      localStorage.setItem("gbSearchHistory", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const clearHistory = () => {
    setGbSearchHistory([]);
    localStorage.removeItem("gbSearchHistory");
  };

  const handleClose = (q = true) => {
    setSearching(false);
    if (q) setQ("");
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isSearching) {
        inputRef.current?.blur();
        handleClose();
      }

      if (event.ctrlKey && event.key === " ") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearching]);

  useEffect(() => {
    if (debouncedQ?.trim()) saveHistory(debouncedQ?.trim());
  }, [debouncedQ]);

  return (
    <div
      className={`
      ${
        isSearching
          ? "absolute top-0 left-0 z-[60] w-screen flex justify-center bg-[#16151A]/75 h-screen"
          : ""
      }`}
      onClick={handleClose}
    >
      <div
        className={`${
          isSearching ? "min-w-[280px] w-full max-w-[740px] h-fit" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isSearching ? (
          debouncedQ?.trim() ? (
            user ? (
              <GlobalSearchContainer
                q={debouncedQ.trim()}
                handleClose={handleClose}
              />
            ) : (
              <div className="bg-[#16151A] border border-[#222227] rounded-xl top-2 absolute min-w-[280px] w-full max-w-[740px] pt-[70px] px-6 pb-6">
                <p className="text-center">Login Required!</p>
              </div>
            )
          ) : (
            <ShowLastGbSearches
              gbSearchHistory={gbSearchHistory}
              clearHistory={clearHistory}
              setQ={setQ}
            />
          )
        ) : null}
        <div className="flex justify-center items-center h-[70px] mx-2">
          <div className="relative w-full">
            <input
              ref={inputRef}
              className="h-10 w-full bg-[#222227] rounded-xl pl-5 pr-20 focus:outline-none text-white placeholder:text-[#c0c0c0]"
              placeholder="Artist, track or podcast"
              onFocus={() => setSearching(true)}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            ></input>
            <div className="absolute top-0 right-0 h-full flex items-center mr-5">
              {isSearching ? (
                <span
                  className="cursor-pointer"
                  onClick={() => {
                    setSearching(false);
                    setQ("");
                  }}
                >
                  close
                </span>
              ) : (
                <SearchSvg className="fill-white w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SideBarToggler = () => {
  const open = sidebarStore((state) => state.open);
  const setOpen = sidebarStore((state) => state.setOpen);

  const toggleSidebar = () => {
    setOpen(!open);
  };

  if (open && window.innerWidth > 1200) return null;
  return (
    <div className="h-[70px] flex items-center mr-8">
      <button onClick={toggleSidebar}>
        <MenuSvg
          className={`w-6 h-6 ${open ? "stroke-[#25a56a]" : "stroke-white"}`}
        />
      </button>
    </div>
  );
};

const Header = () => {
  const user = authConfigStore((state) => state.user);
  const showGlobalSearch = pageItemsStore((state) => state.showGlobalSearch);

  return (
    <div className="h-[70px] border-[#222227] border-b px-[30px] bg-[#16151A] flex">
      <SideBarToggler />
      <div className="flex h-full items-center gap-[30px] flex-grow">
        {user && <Tab>Profile</Tab>}
        <Tab>About</Tab>
        <Tab>Contacts</Tab>
        {showGlobalSearch ? (
          <div className="lg:ml-[30px] md:w-fit w-full">
            <SearchInput />
          </div>
        ) : null}
      </div>
      <div className="hidden items-center sm:flex md:ml-0 ml-8">
        <OptionSignLogout user={user} />
      </div>
    </div>
  );
};

export default Header;
