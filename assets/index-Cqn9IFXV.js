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
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _$target, _store, _App_instances, loadPopularMovies_fn;
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
const MOVIE_COUNT = {
  UNIT: 20,
  MAX_PAGE: 500
};
const ERROR_MESSAGES = {
  NO_RESULT: "검색 결과가 없습니다.",
  MOVIE_FETCH_FAILED: "영화 정보를 불러오는 데 실패했습니다. 새로고침 해 주세요."
};
const SCORE_MESSAGES = {
  2: "최악이예요",
  4: "별로예요",
  6: "보통이에요",
  8: "재미있어요",
  10: "명작이에요"
};
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
    return response.results.map((movie) => ({
      ...movie,
      id: movie.id.toString(),
      vote_average: movie.vote_average.toFixed(1)
    }));
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
    return { ...response, results: response.results };
  } catch (error) {
    if (error instanceof Error && onError) {
      onError(error);
    }
    throw error;
  }
};
const fetchMovieDetail = async (id, onError) => {
  try {
    const params = new URLSearchParams({
      language: "ko-KR"
    });
    const response = await APIClient.get(`/movie/${id}?${params.toString()}`);
    return {
      ...response,
      genres: response.genres.map((genre) => genre.name),
      vote_average: response.vote_average.toFixed(1)
    };
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
      <form id="${SEARCH_FORM}" class="${SEARCH_FORM}" data-testid="${SEARCH_FORM}">
        <input type="text" name="query" data-testid="search-input" class="search-bar" placeholder="검색어를 입력하세요" autocomplete="off" />
        <button type="submit" class="search-button">
          <img src="./images/search.png" alt="search" width="16" height="16" />
        </button>
      </form>
    </div>
  `
  );
};
function attachSearchEvent(store) {
  const $searchForm = document.querySelector(
    "#search-form"
  );
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
    <header id="header" class="header-container">
      <div class="header">
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
    window.addEventListener("scroll", () => {
      if (window.scrollY > 0) {
        $header.classList.add("scrolled");
      } else {
        $header.classList.remove("scrolled");
      }
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
      <div class="overlay" aria-hidden="true"></div>
      <div class="top-rated-container">
        <div class="top-rated-movie">
          <div class="rate">
            <img src="./images/star_empty.png" class="star" />
            <span class="rate-value">${vote_average}</span>
          </div>
          <div class="title">${title}</div>
          <button class="primary detail" data-testid="banner-detail-button">자세히 보기</button>
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
const Rating = (initialScore = 0) => {
  const score = initialScore;
  const scoreMessage = SCORE_MESSAGES[score] || "별점이 없어요";
  return (
    /* html */
    `
    <div class="rating" data-testid="rating">
      <div class="rating-bar">
        <label for="star0">
          <input type="radio" id="star0" class="rating__input" name="rating" value="0">
          <span class="star-icon"></span>
        </label>
        <label for="star2" class="rating__label rating__label--full" data-testid="star2">
          <input type="radio" id="star2" class="rating__input" name="rating" value="2">
          <span class="star-icon"></span>
        </label>
        <label for="star4" class="rating__label rating__label--full" data-testid="star4">
          <input type="radio" id="star4" class="rating__input" name="rating" value="4">
          <span class="star-icon"></span>
        </label>
        <label for="star6" class="rating__label rating__label--full" data-testid="star6">
          <input type="radio" id="star6" class="rating__input" name="rating" value="6">
          <span class="star-icon"></span>
        </label>
        <label for="star8" class="rating__label rating__label--full" data-testid="star8">
          <input type="radio" id="star8" class="rating__input" name="rating" value="8">
          <span class="star-icon"></span>
        </label>
        <label for="star10" class="rating__label rating__label--full" data-testid="star10">
          <input type="radio" id="star10" class="rating__input" name="rating" value="10">
          <span class="star-icon"></span>
        </label>
      </div>
      <div class="rating-information">
        <p class="subtitle" data-testid="score-message">${scoreMessage}</p>
        <p class="subtitle color-95a1b2">(${score}/10)</p>
      </div>
    </div>
  `
  );
};
const attachRatingEvents = (movieId, store) => {
  var _a;
  const $rateWrap = document.querySelector(".rating");
  if (!$rateWrap) return;
  const scores = store.getState().starRatings || [];
  let currentScore = ((_a = scores.find((rating) => rating.id === movieId)) == null ? void 0 : _a.score) || 0;
  const radio = $rateWrap.querySelector(
    `#star${currentScore}`
  );
  if (radio) {
    radio.checked = true;
  }
  const stars = $rateWrap.querySelectorAll(".star-icon");
  function initStars() {
    stars.forEach((star) => star.classList.remove("filled"));
  }
  function checkedRate() {
    if (!$rateWrap) return;
    const checkedRadio = $rateWrap.querySelector(
      '.rating input[type="radio"]:checked'
    );
    initStars();
    if (checkedRadio) {
      const starLabels = Array.from($rateWrap.querySelectorAll("label"));
      const index = starLabels.findIndex(
        (label) => label.contains(checkedRadio)
      );
      for (let i = 0; i <= index; i++) {
        const icon = starLabels[i].querySelector(".star-icon");
        if (icon) {
          icon.classList.add("filled");
        }
      }
    }
  }
  function saveRate() {
    if (!$rateWrap) return;
    const checkedRadio = $rateWrap.querySelector(
      '.rating input[type="radio"]:checked'
    );
    if (checkedRadio) {
      const newScore = Number(checkedRadio.value);
      let starRatings = store.getState().starRatings || [];
      const index = starRatings.findIndex((r) => r.id === movieId);
      if (index !== -1) {
        starRatings[index].score = newScore;
      } else {
        starRatings.push({ id: movieId, score: newScore });
      }
      localStorage.setItem("starRatings", JSON.stringify(starRatings));
      store.setState({ starRatings });
    }
  }
  checkedRate();
  stars.forEach((starIcon) => {
    starIcon.addEventListener("click", () => {
      setTimeout(() => {
        checkedRate();
        saveRate();
      }, 0);
    });
  });
};
const modalContentTemplate = async (id, store) => {
  const movie = await fetchMovieDetail(
    id,
    (error) => alert(error.message)
  );
  const ratingHTML = Rating(getCurrentScore(id, store));
  const contentHTML = (
    /* html */
    `
    <div class="modal-image">
      <div class="skeleton-detail-thumbnail"></div>
      <img src="${movie.poster_path ? "https://image.tmdb.org/t/p/original" + movie.poster_path : "./images/logo.png"}" alt="${movie.title}" class="detail-thumbnail" />
    </div>
    <div class="modal-description" data-testid="modal">
      <div class="description-information">
        <h2>${movie.title}</h2>
        <p class="category">${movie.release_date.slice(
      0,
      4
    )} · ${movie.genres.join(", ")}</p>
        <p class="rate">
          <span class="label">평균</span>
          <img src="./images/star_filled.png" class="star" /><span>${movie.vote_average}</span>
        </p>
      </div>
      <hr />
      <p class="subtitle">내 별점</p>
      <div id="modal-rating">${ratingHTML}</div>
      <hr />
      <p class="subtitle">줄거리</p>
      <p class="detail">${movie.overview || "줄거리 정보가 없습니다"}</p>
    </div>
  `
  );
  setTimeout(() => {
    attachRatingEvents(id, store);
  }, 0);
  return contentHTML;
};
const getCurrentScore = (id, store) => {
  var _a;
  const scores = store.getState().starRatings || [];
  return ((_a = scores.find((rating) => rating.id === id)) == null ? void 0 : _a.score) || 0;
};
class Modal {
  constructor(store, contentGenerator) {
    __publicField(this, "store");
    __publicField(this, "contentGenerator");
    __publicField(this, "modalBackground");
    __publicField(this, "closeButton");
    __publicField(this, "modalContainer");
    __publicField(this, "currentMovieId", null);
    this.store = store;
    this.contentGenerator = contentGenerator;
    this.modalBackground = document.querySelector(
      "#modal-background"
    );
    this.closeButton = document.querySelector("#close-modal");
    this.modalContainer = this.modalBackground.querySelector(
      ".modal-container"
    );
    this.bindEvents();
    this.store.subscribe(() => {
      if (this.isOpen() && this.currentMovieId !== null) {
        this.updateRating();
      }
    });
  }
  bindEvents() {
    this.closeButton.addEventListener("click", this.close.bind(this));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.close();
      }
    });
    this.modalBackground.addEventListener("click", (e) => {
      if (e.target === this.modalBackground) {
        this.close();
      }
    });
  }
  open(movieId) {
    this.currentMovieId = movieId;
    this.contentGenerator(movieId, this.store).then((contentHTML) => {
      this.modalContainer.innerHTML = contentHTML;
      this.modalBackground.classList.add("active");
      this.attachThumbnailLoadEvent(this.modalContainer);
    });
  }
  updateRating() {
    if (this.currentMovieId !== null) {
      this.contentGenerator(this.currentMovieId, this.store).then(
        (contentHTML) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(contentHTML, "text/html");
          const newRating = doc.querySelector("#modal-rating");
          const currentRating = this.modalContainer.querySelector("#modal-rating");
          if (newRating && currentRating) {
            currentRating.innerHTML = newRating.innerHTML;
          }
        }
      );
    }
  }
  isOpen() {
    return this.modalBackground.classList.contains("active");
  }
  close() {
    this.modalBackground.classList.remove("active");
    this.currentMovieId = null;
  }
  attachThumbnailLoadEvent(container = document) {
    const thumbnail = container.querySelector(
      "img.detail-thumbnail"
    );
    if (!thumbnail) return;
    if (!thumbnail.getAttribute("data-load-listener-attached")) {
      thumbnail.addEventListener("load", function() {
        this.style.display = "block";
        if (this.previousElementSibling && this.previousElementSibling.classList.contains(
          "skeleton-detail-thumbnail"
        )) {
          this.previousElementSibling.style.display = "none";
        }
      });
      thumbnail.setAttribute("data-load-listener-attached", "true");
    }
  }
}
class Banner {
  constructor($container, store) {
    __publicField(this, "$container");
    __publicField(this, "store");
    __publicField(this, "modal");
    __publicField(this, "detailHandler");
    this.$container = $container;
    this.store = store;
    this.modal = new Modal(this.store, modalContentTemplate);
    this.detailHandler = this.handleDetailButtonClick.bind(this);
    this.store.subscribe(this.render.bind(this));
    this.render(this.store.getState());
  }
  render(state) {
    var _a;
    if (!state.query) {
      if (state.movies.length) {
        const movie = state.movies[0];
        this.$container.innerHTML = bannerTemplate(movie);
        const $banner = this.$container.querySelector("#banner");
        if ($banner && movie.backdrop_path) {
          $banner.style.backgroundImage = `url(${"https://image.tmdb.org/t/p/original"}${movie.backdrop_path})`;
        }
        const $detailButton = this.$container.querySelector(
          ".detail"
        );
        if ($detailButton) {
          const newDetailButton = $detailButton.cloneNode(true);
          newDetailButton.addEventListener(
            "click",
            this.detailHandler.bind(this, movie.id.toString())
          );
          (_a = $detailButton.parentElement) == null ? void 0 : _a.replaceChild(
            newDetailButton,
            $detailButton
          );
        }
      } else {
        this.$container.innerHTML = SkeletonBanner();
      }
    } else {
      this.$container.innerHTML = "";
    }
  }
  handleDetailButtonClick(movieId) {
    this.modal.open(movieId);
  }
}
const ListTitle = (query) => {
  const title = query ? `"${query}" 검색 결과` : "지금 인기 있는 영화";
  return (
    /* html */
    `
    <h2 id="list-title">${title}</h2>
  `
  );
};
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const MovieItem = ({ id, poster_path, title, vote_average }) => {
  const imageUrl = poster_path ? `${POSTER_URL}${poster_path}` : "./images/logo.png";
  return (
    /* html */
    `
    <li data-movie-id="${id}">
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
const fullMovieListTemplate = ({
  movies,
  query,
  loading
}) => {
  return (
    /* html */
    `
    <main>
      <section>
        ${ListTitle(query)}
        <ul id="movie-list" class="thumbnail-list" data-testid="movie-list">
          ${movieItemsTemplate({ movies, query })}
        </ul>
      </section>
    </main>
  `
  );
};
const movieItemsTemplate = ({
  movies,
  query
}) => {
  let movieContent = "";
  if (movies.length === 0 && !query) {
    movieContent = new Array(MOVIE_COUNT.UNIT).fill(0).map(() => SkeletonMovieItem()).join("");
  } else if (movies.length === 0 && query) {
    movieContent = `<div></div>
                    <div></div>
                    <div class="center">
                      <img src="./images/not_found.png"/>
                      <h2 data-testid="no-result-message">${ERROR_MESSAGES.NO_RESULT}</h2>
                    </div>`;
  } else {
    movieContent = movies.map((movie) => MovieItem(movie)).join("");
  }
  return movieContent;
};
class MovieList {
  constructor($container, store) {
    __publicField(this, "$container");
    __publicField(this, "store");
    __publicField(this, "previousMoviesLength", 0);
    __publicField(this, "previousQuery", "");
    this.$container = $container;
    this.store = store;
    this.store.subscribe(this.render.bind(this));
    this.render(this.store.getState());
  }
  render(state) {
    if (!this.previousMoviesLength || state.query !== this.previousQuery) {
      this.$container.innerHTML = fullMovieListTemplate({
        movies: state.movies,
        query: state.query,
        searchedMoviesLength: state.searchedMoviesLength,
        loading: state.loading
      });
      this.previousMoviesLength = state.movies.length;
      this.previousQuery = state.query;
    } else {
      if (state.movies.length > this.previousMoviesLength) {
        const ul = this.$container.querySelector(
          "ul#movie-list"
        );
        const newMovies = state.movies.slice(this.previousMoviesLength);
        const newItemsHTML = movieItemsTemplate({
          movies: newMovies,
          loading: state.loading,
          query: state.query
        });
        ul.insertAdjacentHTML("beforeend", newItemsHTML);
        this.previousMoviesLength = state.movies.length;
      }
    }
    this.removeSkeleton(state.loading);
    this.attachThumbnailLoadEvent(this.$container);
    this.attachMovieItemEvents(this.store, this.$container);
  }
  removeSkeleton(loading) {
    if (!loading) {
      const $ul = document.querySelector("#movie-list");
      if ($ul) {
        const $skeletons = $ul.querySelectorAll(".skeleton-item");
        $skeletons.forEach((s) => s.remove());
      }
    }
  }
  attachThumbnailLoadEvent(container = document) {
    const thumbnails = container.querySelectorAll("img.thumbnail");
    thumbnails.forEach((img) => {
      if (!img.getAttribute("data-load-listener-attached")) {
        img.addEventListener("load", function() {
          this.style.display = "block";
          if (this.previousElementSibling && this.previousElementSibling.classList.contains("skeleton-thumbnail")) {
            this.previousElementSibling.style.display = "none";
          }
        });
        img.setAttribute("data-load-listener-attached", "true");
      }
    });
  }
  attachMovieItemEvents(store, container) {
    const modal = new Modal(store, modalContentTemplate);
    const items = container.querySelectorAll("li[data-movie-id]");
    items.forEach((li) => {
      li.addEventListener("click", async () => {
        const movieIdStr = li.getAttribute("data-movie-id");
        if (movieIdStr) {
          const state = store.getState();
          const movie = state.movies.find(
            (m) => m.id.toString() === movieIdStr
          );
          if (movie) {
            modal.open(movie.id);
          }
        }
      });
    });
  }
}
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
    __privateAdd(this, _App_instances);
    __privateAdd(this, _$target);
    __privateAdd(this, _store);
    __publicField(this, "bannerContainer");
    __publicField(this, "mainContainer");
    __publicField(this, "bannerComponent");
    __publicField(this, "movieListComponent");
    __privateSet(this, _$target, $target);
    __privateSet(this, _store, new Store({
      movies: [],
      query: "",
      searchedMoviesLength: 0,
      loading: false,
      starRatings: localStorage.getItem("starRatings") ? JSON.parse(localStorage.getItem("starRatings")) : []
    }));
    const $headerTemplate = document.createElement("template");
    $headerTemplate.innerHTML = Header(__privateGet(this, _store));
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
    this.bannerComponent = new Banner(this.bannerContainer, __privateGet(this, _store));
    this.movieListComponent = new MovieList(this.mainContainer, __privateGet(this, _store));
    if (__privateGet(this, _store).getState().movies.length === 0) {
      __privateMethod(this, _App_instances, loadPopularMovies_fn).call(this);
    }
    window.addEventListener("scroll", async () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 180) {
        const state = __privateGet(this, _store).getState();
        const currentPage = Math.floor(state.movies.length / MOVIE_COUNT.UNIT) + 1;
        __privateGet(this, _store).setState({ loading: true });
        if (!state.query && state.movies.length < MOVIE_COUNT.MAX_PAGE * MOVIE_COUNT.UNIT) {
          const newMovies = await fetchPopularMovies(
            (error) => alert(error.message),
            currentPage
          );
          __privateGet(this, _store).setState({ movies: [...state.movies, ...newMovies] });
          return;
        }
        if (state.movies.length >= state.searchedMoviesLength) return;
        const newMoviesData = await fetchSearchedMovies(
          state.query,
          (error) => alert(error.message),
          currentPage
        );
        __privateGet(this, _store).setState({
          movies: [...state.movies, ...newMoviesData.results],
          loading: false
        });
      }
    });
  }
}
_$target = new WeakMap();
_store = new WeakMap();
_App_instances = new WeakSet();
loadPopularMovies_fn = async function() {
  __privateGet(this, _store).setState({ loading: true });
  const movies = await fetchPopularMovies(
    (error) => alert(error.message)
  );
  __privateGet(this, _store).setState({ movies, loading: false });
};
const $app = document.querySelector("#wrap");
new App($app);
