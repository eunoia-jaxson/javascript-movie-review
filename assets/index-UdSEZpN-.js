var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _$container, _store, _$container2, _store2, _$target, _store3;
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const MOVIE_COUNT = Object.freeze({
  UNIT: 20,
  MAX_PAGE: 500
});
const ERROR_MESSAGES = Object.freeze({
  NO_RESULT: "검색 결과가 없습니다.",
  MOVIE_FETCH_FAILED: "영화 정보를 불러오는 데 실패했습니다. 새로고침 해 주세요."
});
const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlM2ZmNTk1MDlmN2Y2N2U1NzAzMzZhMjUzODhlZjBlNSIsIm5iZiI6MTc0MjI4NTk1Ni41ODQsInN1YiI6IjY3ZDkyYzg0MzU3MmFmNWJjYzA4ODdkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Yv6fX48EgOCDq9fl6m1GDhYE7KfyDC7emlbYHhcO0us";
class APIClient {
  static async get(endpoint) {
    return this.request("GET", endpoint);
  }
  static async request(method, endpoint) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      }
    };
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || ERROR_MESSAGES.MOVIE_FETCH_FAILED);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
}
const fetchPopularMovies = async (onError, page = 1) => {
  try {
    const params = new URLSearchParams({
      language: "ko-KR",
      page: page.toString()
    });
    const response = await APIClient.get(`/movie/popular?${params.toString()}`);
    return response.results;
  } catch (error) {
    if (error instanceof Error && onError) {
      onError(error);
    }
    throw error;
  }
};
const fetchSearchedMovies = async (query, onError, page = 1) => {
  try {
    const params = new URLSearchParams({
      query,
      include_adult: "false",
      language: "ko-KR",
      page: page.toString()
    });
    const response = await APIClient.get(`/search/movie?${params.toString()}`);
    return response;
  } catch (error) {
    if (error instanceof Error && onError) {
      onError(error);
    }
    throw error;
  }
};
const SEARCH_FORM = "search-form";
const SearchBar = (store) => {
  setTimeout(() => attachSearchEvent(store), 0);
  return (
    /* html */
    `
    <div class="search-bar-container">
      <form id="${SEARCH_FORM}" class="${SEARCH_FORM}" data-testid='${SEARCH_FORM}'>
        <input type="text" name="query" data-testid='search-input' class="search-bar" placeholder="검색어를 입력하세요" autocomplete="off" />
        <button type="submit" class="search-button">
          <img src="./images/search.png" alt="search" width="16" height="16" />
        </button>
      </form>
    </div>
  `
  );
};
function attachSearchEvent(store) {
  const $searchForm = document.querySelector("#search-form");
  if ($searchForm) {
    $searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData($searchForm);
      const query = formData.get("query");
      if (!query) return;
      store.setState({ loading: true });
      const searchedMovies = await fetchSearchedMovies(
        query,
        (error) => alert(error.message)
      );
      if (searchedMovies) {
        store.setState({
          movies: searchedMovies.results,
          query,
          searchedMoviesLength: searchedMovies.total_results
        });
      }
      store.setState({ loading: false });
      $searchForm.reset();
      window.scrollTo(0, 0);
    });
  }
}
const Header = (store) => {
  setTimeout(attachHeaderStyle, 0);
  return (
    /* html */
    `
    <header id="header" class="header">
      <div class="header-container">
        <h1 class="logo">
          <a href="/javascript-movie-review">
            <img src="./images/logo.png" alt="MovieList" />
          </a>
        </h1>
        ${SearchBar(store)}
        <div class="empty"></div>
      </div>
    </header>
  `
  );
};
function attachHeaderStyle() {
  const $header = document.querySelector("#header");
  if ($header) {
    window.addEventListener("scroll", async (event) => {
      if (window.scrollY > 0) {
        $header.classList.add("scrolled");
        return;
      }
      $header.classList.remove("scrolled");
    });
  }
}
const Footer = () => {
  return (
    /*html*/
    `
    <footer class="footer">
      <p>
        <img src="./images/woowacourse_logo.png" width="180" />
      </p>
      <p>&copy; 우아한테크코스 All Rights Reserved.</p>
    </footer>
  `
  );
};
const bannerTemplate = ({ vote_average, title }) => {
  return (
    /* html */
    `
    <div id="banner" class="background-container">
      <div class="overlay" aria-hidden="true" ></div>
      <div class="top-rated-container">
        <div class="top-rated-movie">
          <div class="rate">
            <img src="./images/star_empty.png" class="star" />
            <span class="rate-value">${vote_average}</span>
          </div>
          <div class="title">${title}</div>
          <button class="primary detail">자세히 보기</button>
        </div>
      </div>
    </div>
  `
  );
};
const SkeletonBanner = () => {
  return (
    /* html */
    `
    <div id="banner" class="background-container skeleton-banner">
      <div class="overlay" aria-hidden="true"></div>
      <div class="skeleton-banner-content">
      </div>
    </div>
  `
  );
};
class Banner {
  constructor($container, store) {
    __privateAdd(this, _$container);
    __privateAdd(this, _store);
    __privateSet(this, _$container, $container);
    __privateSet(this, _store, store);
    __privateGet(this, _store).subscribe(this.render.bind(this));
    this.render(__privateGet(this, _store).getState());
  }
  render(state) {
    if (!state.query) {
      if (state.movies.length) {
        __privateGet(this, _$container).innerHTML = bannerTemplate(state.movies[0]);
        const $banner = __privateGet(this, _$container).querySelector("#banner");
        if ($banner) {
          $banner.style.backgroundImage = `url(${"https://image.tmdb.org/t/p/original"}${state.movies[0].backdrop_path})`;
        }
      } else {
        __privateGet(this, _$container).innerHTML = SkeletonBanner();
      }
    } else {
      __privateGet(this, _$container).innerHTML = "";
    }
  }
}
_$container = new WeakMap();
_store = new WeakMap();
const ListTitle = ({ query }) => {
  const title = query ? `"${query}" 검색 결과` : "지금 인기 있는 영화";
  return (
    /* html */
    `
    <h2 id="list-title">${title}</h2>
  `
  );
};
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const MovieItem = ({ poster_path, title, vote_average }) => {
  const imageUrl = poster_path ? `${POSTER_URL}${poster_path}` : "./images/logo.png";
  return (
    /* html */
    `
    <li>
      <div class="item">
        <div class="skeleton-thumbnail"></div>
        <img class="thumbnail" src="${imageUrl}" alt="${title}" />
        <div class="item-desc">
          <p class="rate">
            <img src="./images/star_empty.png" class="star" />
            <span>${vote_average}</span>
          </p>
          <strong>${title}</strong>
        </div>
      </div>
    </li>
  `
  );
};
const MORE_BUTTON = "more-button";
const MoreButton = () => {
  return (
    /* html */
    `
    <button id="${MORE_BUTTON}" class="primary more" data-testid="${MORE_BUTTON}">더 보기</button>
  `
  );
};
function attachMoreButtonEvent(store) {
  const $button = document.querySelector("#more-button");
  if ($button) {
    $button.addEventListener("click", async () => {
      const state = store.getState();
      const currentPage = Math.floor(state.movies.length / MOVIE_COUNT.UNIT) + 1;
      store.setState({ loading: true });
      if (!state.query) {
        const newMovies = await fetchPopularMovies(
          (error) => alert(error.message),
          currentPage
        );
        store.setState({ movies: [...state.movies, ...newMovies] });
        if (state.movies.length >= MOVIE_COUNT.MAX_PAGE * MOVIE_COUNT.UNIT) {
          $button.remove();
        }
        return;
      }
      const newMoviesData = await fetchSearchedMovies(
        state.query,
        (error) => alert(error.message),
        currentPage
      );
      store.setState({
        movies: [...state.movies, ...newMoviesData.results],
        loading: false
      });
      if (state.movies.length >= state.searchedMoviesLength) {
        $button.remove();
      }
    });
  }
}
const SkeletonMovieItem = () => {
  return (
    /* html */
    `
    <li class="skeleton-item">
      <div class="skeleton-thumbnail"></div>
      <div class="skeleton-desc">
        <div class="skeleton-rate"></div>
        <div class="skeleton-title"></div>
      </div>
    </li>
  `
  );
};
const MOVIE_LIST = "movie-list";
const movieListTemplate = ({
  movies,
  query,
  searchedMoviesLength,
  loading
}) => {
  const showMoreButton = !query && movies.length < 1e4 || movies.length < searchedMoviesLength;
  let movieContent = "";
  if (movies.length === 0 && !query) {
    movieContent = new Array(MOVIE_COUNT.UNIT).fill(0).map(() => SkeletonMovieItem()).join("");
  } else if (movies.length === 0 && query) {
    movieContent = `<div></div>
                    <div></div>
                    <div class="center">
                      <img src="./images/not_found.png"/>
                      <h2 data-testid='no-result-message'>${ERROR_MESSAGES.NO_RESULT}</h2>
                    </div>`;
  } else {
    movieContent = movies.map((movie) => MovieItem(movie)).join("");
    if (loading) {
      const skeletons = new Array(MOVIE_COUNT.UNIT).fill(0).map(() => SkeletonMovieItem()).join("");
      movieContent += skeletons;
    }
  }
  setTimeout(attachThumbnailLoadEvent, 0);
  return (
    /* html */
    `
    <main>
      <section>
        ${ListTitle({ query })}
        <ul id="${MOVIE_LIST}" class="thumbnail-list" data-testid="${MOVIE_LIST}">
          ${movieContent}
        </ul>
        ${showMoreButton ? MoreButton() : ""}
      </section>
    </main>
  `
  );
};
const attachThumbnailLoadEvent = () => {
  const thumbnails = document.querySelectorAll("img.thumbnail");
  thumbnails.forEach((img) => {
    img.addEventListener("load", function() {
      this.style.display = "block";
      if (this.previousElementSibling && this.previousElementSibling.classList.contains("skeleton-thumbnail")) {
        this.previousElementSibling.style.display = "none";
      }
    });
  });
};
class MovieList {
  constructor($container, store) {
    __privateAdd(this, _$container2);
    __privateAdd(this, _store2);
    __privateSet(this, _$container2, $container);
    __privateSet(this, _store2, store);
    __privateGet(this, _store2).subscribe(this.render.bind(this));
    this.render(__privateGet(this, _store2).getState());
  }
  render(state) {
    __privateGet(this, _$container2).innerHTML = movieListTemplate({
      movies: state.movies,
      query: state.query,
      searchedMoviesLength: state.searchedMoviesLength
    });
    attachMoreButtonEvent(__privateGet(this, _store2));
  }
}
_$container2 = new WeakMap();
_store2 = new WeakMap();
class Store {
  constructor(initialState) {
    __publicField(this, "state");
    __publicField(this, "subscribers");
    this.state = initialState;
    this.subscribers = [];
  }
  subscribe(fn) {
    this.subscribers.push(fn);
    fn(this.state);
  }
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach((fn) => fn(this.state));
  }
  getState() {
    return this.state;
  }
}
class App {
  constructor($target) {
    __privateAdd(this, _$target);
    __privateAdd(this, _store3);
    __privateSet(this, _$target, $target);
    __privateSet(this, _store3, new Store({
      movies: [],
      query: "",
      searchedMoviesLength: 0,
      loading: false
    }));
    const $headerTemplate = document.createElement("template");
    $headerTemplate.innerHTML = Header(__privateGet(this, _store3));
    __privateGet(this, _$target).appendChild($headerTemplate.content);
    this.bannerContainer = document.createElement("section");
    this.bannerContainer.id = "banner-container";
    __privateGet(this, _$target).appendChild(this.bannerContainer);
    this.mainContainer = document.createElement("div");
    this.mainContainer.classList.add("container");
    __privateGet(this, _$target).appendChild(this.mainContainer);
    const $footerTemplate = document.createElement("template");
    $footerTemplate.innerHTML = Footer();
    __privateGet(this, _$target).appendChild($footerTemplate.content);
    this.bannerComponent = new Banner(this.bannerContainer, __privateGet(this, _store3));
    this.movieListComponent = new MovieList(this.mainContainer, __privateGet(this, _store3));
    if (__privateGet(this, _store3).getState().movies.length === 0) {
      this.loadPopularMovies();
    }
  }
  async loadPopularMovies() {
    __privateGet(this, _store3).setState({ loading: true });
    const movies = await fetchPopularMovies((error) => alert(error.message));
    __privateGet(this, _store3).setState({ movies, loading: false });
  }
}
_$target = new WeakMap();
_store3 = new WeakMap();
const $app = document.querySelector("#wrap");
new App($app);
