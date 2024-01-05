import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import openai from "../utils/openai";
import { API_OPTIONS } from "../utils/constant";



import "./style.scss";

import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";
import noResults from "../../assets/no-results.png";

const SearchResult = () => {
    const [data, setData] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [loading, setLoading] = useState(false);
    const { query } = useParams();
    console.log({query});

    const searchMovieTMDB = async (movie) => {
        const data = await fetch(
          "https://api.themoviedb.org/3/search/movie?query=" +
            movie +
            "&include_adult=false&language=en-US&page=1",
          API_OPTIONS
        );
        const json = await data.json();
        return json.results;
      };

    const handleGptSearchClick = async () => {
        await console.log("in the handleGptSearch")
        if (query) {
          const gptQuery =
            "Act as a Movie Recommendation system and suggest some specific movies for the query : " +
            query +
            ". only give me names of 5 movies, comma seperated like the example result given ahead. Example Result: Gadar, Sholay, Don, Golmaal, Koi Mil Gaya";
            console.log({gptQuery});
          const gptResults = await openai.chat.completions.create({
            messages: [{ role: "user", content: gptQuery }],
            model: "gpt-3.5-turbo",
          });
          console.log({gptResults});
    
          console.log(gptResults.choices?.[0]?.message?.content);
          const newResult = gptResults.choices?.[0]?.message?.content;
          console.log({newResult});
          const gptMovies = gptResults.choices?.[0]?.message?.content.split(",");
          const promiseArray = gptMovies.map((movie) => searchMovieTMDB(movie));
          const tmdbResults = await Promise.all(promiseArray);
          const results = await tmdbResults.flat();
          const tmdbFinalResults ={
            results
          }
          setData(tmdbFinalResults);
          console.log({tmdbFinalResults});
        //   dispatch(addGptMovieResult({movieNames: gptMovies, movieResults: tmdbResults}));
        }
      };


    useEffect(()=>{
        handleGptSearchClick();
    },[query])

    const fetchInitialData = () => {
        setLoading(true);

        fetchDataFromApi(`/search/multi?query=${query}&page=${pageNum}`).then(
            (res) => {
                console.log({res});
                // setData(res);
                setPageNum((prev) => prev + 1);
                setLoading(false);
            }
        );
    };

    const fetchNextPageData = () => {
        // fetchDataFromApi(`/search/multi?query=${query}&page=${pageNum}`).then(
        //     (res) => {
        //         if (data?.results) {
        //             setData({
        //                 ...data,
        //                 results: [...data?.results, ...res.results],
        //             });
        //         } else {
        //             setData(res);
        //         }
        //         setPageNum((prev) => prev + 1);
        //     }
        // );
    };

    useEffect(() => {
        setPageNum(1);
        fetchInitialData();
    }, [query]);

    return (
        <div className="searchResultsPage">
            {loading && <Spinner initial={true} />}
            {!loading && (
                <ContentWrapper>
                    {data?.results?.length > 0 ? (
                        <>
                            <div className="pageTitle">
                                {`Search ${
                                    data?.total_results > 1
                                        ? "results"
                                        : "result"
                                } of '${query}'`}
                            </div>
                            <InfiniteScroll
                                className="content"
                                dataLength={data?.results?.length || []}
                                next={fetchNextPageData}
                                hasMore={pageNum <= data?.total_pages}
                                loader={<Spinner />}
                            >
                                {data?.results.map((item, index) => {
                                    if (item.media_type === "person") return;
                                    return (
                                        <MovieCard
                                            key={index}
                                            data={item}
                                            fromSearch={true}
                                        />
                                    );
                                })}
                            </InfiniteScroll>
                        </>
                    ) : (
                        <span className="resultNotFound">
                            Sorry, Results not found!
                        </span>
                    )}
                </ContentWrapper>
            )}
        </div>
    );
};

export default SearchResult;
