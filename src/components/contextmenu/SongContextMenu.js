import { useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  AddToQueueSvg,
  DeleteSvg,
  DetailsSvg,
  ShareSvg,
} from "../../assets/svg";
import playerStore from "../../zstore/playerStore";
import {
  SHARE_APIS,
  useContextMenuCloseHandler,
  useContextPosition,
} from "../../api/utils";
import ContextMenuButton from "./components";
import authConfigStore from "../../zstore/authConfigStore";
import contextMenuStore from "../../zstore/contextMenuStore";
import { useNavigate, useParams } from "react-router-dom";
import ROUTES from "../../router/routes";
import { useDeleteSongsFromPlaylistMutation } from "../../api/playlists/queryHooks";

const SongRemoveFromPlaylist = ({
  song,
  playlist,
  user,
  handleClose,
  callback,
}) => {
  const id = parseInt(useParams().id);
  const { mutate, isLoading } = useDeleteSongsFromPlaylistMutation(id, {
    onSuccess: () => {
      handleClose();
    },
  });

  const handleRemove = () => {
    if (!isLoading) {
      mutate({
        id: id,
        songs_id: [song.id],
      });
      callback?.();
    }
  };
  
  if (user.id === playlist?.author?.id)
    return (
      <ContextMenuButton
        Icon={DeleteSvg}
        title={isLoading ? "Removing" : "Remove"}
        onClick={handleRemove}
      />
    );
  else return null;
};

const SongShareButton = ({ song, callback }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(SHARE_APIS.SONG(song.id))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <ContextMenuButton
      Icon={ShareSvg}
      title={copied ? "Copied!" : "Share"}
      onClick={() => {
        callback?.();
        copyToClipboard();
      }}
    />
  );
};

const AddToQueueOption = ({ song }) => {
  const addToQueue = playerStore((state) => state.addSong);
  const [songAddedToQueue, setSongAddedToQueue] = useState(false);

  const handleAddToQueue = () => {
    addToQueue(song);
    setSongAddedToQueue(true);
  };

  return (
    <ContextMenuButton
      Icon={AddToQueueSvg}
      title={songAddedToQueue ? "Added To Queue" : "Add To Queue"}
      onClick={handleAddToQueue}
    />
  );
};

const SongContextMenu = ({ contextMenuData, handleClose }) => {
  const ref = useRef(null);
  const user = authConfigStore((state) => state.user);
  const setContextMenuData = contextMenuStore((state) => state.setData);
  const navigate = useNavigate();

  useContextMenuCloseHandler(ref, handleClose);
  useContextPosition(ref, contextMenuData, (ele, x, y) => {
    ele.style.left = `${x}px`;
    ele.style.top = `${y}px`;

    ele.classList.remove("opacity-0");
  });

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className="bg-[#151515] absolute z-[60] w-[200px] rounded-md shadow-md overflow-hidden opacity-0 transition-opacity duration-200"
    >
      {user ? (
        <>
          {contextMenuData?.renderedOn === "playlistsong" ? (
            <>
              <SongRemoveFromPlaylist
                song={contextMenuData.song}
                handleClose={handleClose}
                playlist={contextMenuData?.extraContextData.playlist}
                user={user}
              />
            </>
          ) : (
            <>
              <AddToQueueOption song={contextMenuData.song} />
              <ContextMenuButton
                Icon={AddToQueueSvg}
                title={"Add To Playlist"}
                onClick={() =>
                  setContextMenuData({
                    type: "addtoplaylist",
                    song: contextMenuData.song,
                  })
                }
              />
            </>
          )}
        </>
      ) : null}
      <ContextMenuButton
        Icon={DetailsSvg}
        title={"Details"}
        onClick={() => {
          navigate(ROUTES.GET_SONG_URI(contextMenuData.song.id));
          handleClose();
        }}
      />
      <SongShareButton song={contextMenuData.song} />
    </div>,
    document.body
  );
};

export default SongContextMenu;
