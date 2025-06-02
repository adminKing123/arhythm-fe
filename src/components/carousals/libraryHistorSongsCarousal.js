import { Swiper, SwiperSlide } from "swiper/react";
import { useEffect, useRef, useState } from "react";
import { NextSvg, PrevSvg } from "../../assets/svg";
import { useGetLatestSongsFromHistory } from "../../api/songs/queryHooks";
import SongCard, { SongCardLoading } from "../songcards/songcard";
import Button from "../buttons/buttons";
import { NextLink } from "../links/links";
import { Link } from "react-router-dom";
import ROUTES from "../../router/routes";

const SongsSkeleton = () => {
  const [skeletonCount, setSkeletonCount] = useState(6);

  useEffect(() => {
    const updateSkeletonCount = () => {
      const width = window.innerWidth;

      if (width >= 1024) setSkeletonCount(6); // lg
      else if (width >= 768) setSkeletonCount(4); // md
      else if (width >= 640) setSkeletonCount(3); // sm
      else setSkeletonCount(2); // default
    };

    updateSkeletonCount();
    window.addEventListener("resize", updateSkeletonCount);

    return () => window.removeEventListener("resize", updateSkeletonCount);
  }, []);

  return (
    <div className="grid gap-[30px] mt-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: skeletonCount }, (_, index) => (
        <SongCardLoading key={index} />
      ))}
    </div>
  );
};

const Dots = ({ swiperRef, slideLength }) => {
  const [index, setIndex] = useState(0);
  const [pageLength, setPageLength] = useState(0);

  const changeSlide = (index) => {
    const newIndex = Math.floor(
      (swiperRef.current.slides.length / pageLength) * index
    );
    swiperRef.current?.slideToLoop(newIndex);
  };

  useEffect(() => {
    const swiperEle = swiperRef.current;

    const handleChange = () => {
      const curr_index = swiperEle.realIndex;
      const per_page = Math.floor(slideLength / pageLength);
      setIndex(Math.floor(curr_index / per_page));
    };

    if (swiperEle) swiperEle.on("slideChange", handleChange);

    return () => {
      if (swiperEle) swiperEle.off("slideChange", handleChange);
    };
  }, [swiperRef, pageLength, slideLength]);

  useEffect(() => {
    const swiperEle = swiperRef.current;
    const updateSlidesPerView = () => {
      setPageLength(slideLength / swiperEle.params.slidesPerView);
    };

    updateSlidesPerView();

    window.addEventListener("resize", updateSlidesPerView);

    return () => {
      window.removeEventListener("resize", updateSlidesPerView);
    };
  }, [swiperRef, slideLength]);

  if (pageLength)
    return (
      <>
        {Array.from({ length: pageLength }).map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`${dotIndex} cursor-pointer h-[4px] inline-block rounded-sm transition-all duration-300 ${
              dotIndex === index ? "w-5 bg-white" : "w-[10px] bg-[#c0c0c0]"
            } ${dotIndex === pageLength - 1 ? "" : "mr-[10px]"}`}
            onClick={() => changeSlide(dotIndex)}
          ></span>
        ))}
      </>
    );
};

const LibraryHistorSongsCarousal = ({ data }) => {
  const swiperRef = useRef(null);

  const handleNext = () => swiperRef.current && swiperRef.current.slideNext();
  const handlePrev = () => swiperRef.current && swiperRef.current.slidePrev();

  return (
    <div className="relative">
      <Swiper
        spaceBetween={30}
        slidesPerView={2}
        breakpoints={{
          640: {
            slidesPerView: 3,
          },
          768: {
            slidesPerView: 4,
          },
          1024: {
            slidesPerView: 6,
          },
        }}
        onSwiper={(swiperInstance) => {
          swiperRef.current = swiperInstance;
        }}
      >
        {data.results.map((history) => (
          <SwiperSlide key={history.id}>
            <SongCard song={history.song} />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="mt-7 flex justify-end items-center m2lg:justify-center">
        <Dots swiperRef={swiperRef} slideLength={data.results.length} />
        <button
          onClick={handlePrev}
          className="hidden 2lg:inline-block ml-[10px]"
        >
          <PrevSvg className="fill-white hover:fill-[#25a56a] w-[30px] h-[30px] transition-colors duration-300" />
        </button>
        <button onClick={handleNext} className="hidden 2lg:inline-block">
          <NextSvg className="fill-white hover:fill-[#25a56a] w-[30px] h-[30px] transition-colors duration-300" />
        </button>
      </div>
    </div>
  );
};

export const LibraryLatestHistorySongs = () => {
  const { isLoading, isFetching, isError, data } =
    useGetLatestSongsFromHistory();

  if (isLoading || isFetching || isError) return <SongsSkeleton />;

  if (data.results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-2">No Listening History</h2>
        <p className="mb-4">
          You haven't listened to any songs yet. Start exploring and build your
          history!
        </p>
        <Link to={ROUTES.HOME}>
          <Button>Explore Songs</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center flex-wrap mb-8">
        <h2 className="text-white text-[30px]">History</h2>
        <NextLink className="text-[16px]" href={ROUTES.HISTORY}>
          See All
        </NextLink>
      </div>
      <LibraryHistorSongsCarousal data={data} />
    </>
  );
};

export default LibraryHistorSongsCarousal;
