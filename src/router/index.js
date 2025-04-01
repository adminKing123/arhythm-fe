import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ROUTES from "./routes";
import Register from "../pages/register/register";
import VerifyEmail from "../pages/verifyemail/verifyemail";
import Login from "../pages/login/login";
import Home from "../pages/home/home";
import ForgotPassword from "../pages/forgotpassword/forgotpassword";
import Resetpassword from "../pages/forgotpassword/resetpassword";
import { CheckLogin, Main } from "../pages/layouts";
import YourLibrary from "../pages/yourlibrary/yourlibrary";
import Search from "../pages/search/search";
import Queue from "../pages/queue/queue";
import Artists from "../pages/artists/artists";
import Albums from "../pages/albums/albums";
import Playlist from "../pages/playlist/playlist";
import Song from "../pages/song/song";
import Artist from "../pages/artist/artist";
import Album from "../pages/album/album";
import History from "../pages/history/history";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.REGISTER} element={<Register />}></Route>
        <Route path={ROUTES.VERIFYEMAIL} element={<VerifyEmail />}></Route>
        <Route path={ROUTES.LOGIN} element={<Login />}></Route>
        <Route
          path={ROUTES.FORGOTPASSWORD}
          element={<ForgotPassword />}
        ></Route>
        <Route path={ROUTES.RESETPASSWORD} element={<Resetpassword />}></Route>

        <Route element={<CheckLogin />}>
          <Route element={<Main />}>
            <Route index element={<Navigate to={ROUTES.HOME} replace />} />
            <Route path={ROUTES.HOME} element={<Home />}></Route>
            <Route path={ROUTES.YOURLIBRARY} element={<YourLibrary />}></Route>
            <Route path={ROUTES.SEARCH} element={<Search />}></Route>
            <Route path={ROUTES.QUEUE} element={<Queue />}></Route>
            <Route path={ROUTES.ARTISTS} element={<Artists />}></Route>
            <Route path={ROUTES.ALBUMS} element={<Albums />}></Route>
            <Route path={ROUTES.PLAYLIST} element={<Playlist />}></Route>
            <Route path={ROUTES.SONG} element={<Song />}></Route>
            <Route path={ROUTES.ARTIST} element={<Artist />}></Route>
            <Route path={ROUTES.ALBUM} element={<Album />}></Route>
            <Route path={ROUTES.HISTORY} element={<History />}></Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
