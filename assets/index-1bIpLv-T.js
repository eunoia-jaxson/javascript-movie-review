var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
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
  0: "별점이 없어요",
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
        throw new Error(ERROR_MESSAGES.MOVIE_FETCH_FAILED);
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
    return {
      ...response,
      results: response.results.map((movie) => ({
        ...movie,
        id: movie.id.toString(),
        vote_average: movie.vote_average.toFixed(1)
      }))
    };
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
    `#${SEARCH_FORM}`
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
          <button id="detail-button" class="primary detail" data-testid="banner-detail-button">자세히 보기</button>
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
const renderTemplate = (container, html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  container.replaceChildren(template.content.cloneNode(true));
};
const appendHTMLs = (container, html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  container.append(...Array.from(template.content.childNodes));
};
const appendHTML = (container, html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  container.appendChild(template.content.firstChild);
};
const isScrolledToBottom = () => {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
};
const API_BANNER_URL = "https://image.tmdb.org/t/p/original";
class Banner {
  constructor($container, store, $modal) {
    __publicField(this, "$container");
    __publicField(this, "store");
    __publicField(this, "$modal");
    this.$container = $container;
    this.store = store;
    this.$modal = $modal;
    this.store.subscribe(this.render.bind(this));
    this.render(this.store.getState());
  }
  render(state) {
    if (state.query) {
      renderTemplate(this.$container, "");
      return;
    }
    if (state.movies.length) {
      const movie = state.movies[0];
      renderTemplate(this.$container, bannerTemplate(movie));
      const $banner = this.$container.querySelector("#banner");
      if ($banner && movie.backdrop_path) {
        $banner.style.backgroundImage = `url(${API_BANNER_URL}${movie.backdrop_path})`;
      }
      const $detailButton = this.$container.querySelector("#detail-button");
      if ($detailButton) {
        $detailButton.addEventListener(
          "click",
          () => this.$modal.open(movie.id.toString())
        );
      }
      return;
    }
    renderTemplate(this.$container, SkeletonBanner());
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
const fullMovieListTemplate = (movies, query) => (
  /* html */
  `
  <main>
    <section>
      ${ListTitle(query)}
      <ul id="movie-list" class="thumbnail-list" data-testid="movie-list">
        ${movieItemsTemplate(movies, query)}
      </ul>
    </section>
  </main>
`
);
const movieItemsTemplate = (movies, query) => {
  if (movies.length === 0) {
    if (query) {
      return (
        /* html */
        `
        <div></div>
        <div></div>
        <div class="center">
          <img src="./images/not_found.png"/>
          <h2 data-testid="no-result-message">${ERROR_MESSAGES.NO_RESULT}</h2>
        </div>
      `
      );
    }
    return Array.from({ length: MOVIE_COUNT.UNIT }, SkeletonMovieItem).join("");
  }
  return movies.map(MovieItem).join("");
};
class MovieList {
  constructor($container, store, $modal) {
    __publicField(this, "$container");
    __publicField(this, "store");
    __publicField(this, "$modal");
    __publicField(this, "prevMoviesLength", 0);
    __publicField(this, "prevQuery", "");
    this.$container = $container;
    this.store = store;
    this.$modal = $modal;
    this.store.subscribe(this.render.bind(this));
    this.render(this.store.getState());
  }
  render(state) {
    const $ul = this.$container.querySelector("#movie-list");
    if (!this.prevMoviesLength || state.query !== this.prevQuery) {
      renderTemplate(
        this.$container,
        fullMovieListTemplate(state.movies, state.query)
      );
      this.prevMoviesLength = state.movies.length;
      this.prevQuery = state.query;
    } else if (state.movies.length > this.prevMoviesLength) {
      const newMovies = state.movies.slice(this.prevMoviesLength);
      appendHTMLs($ul, movieItemsTemplate(newMovies, state.query));
      this.prevMoviesLength = state.movies.length;
    }
    if (!state.loading && $ul) {
      $ul.querySelectorAll(".skeleton-item").forEach(($li) => $li.remove());
    }
    this.attachThumbnailLoadEvent(this.$container);
    this.attachMovieItemEvents(state);
  }
  attachThumbnailLoadEvent($container) {
    $container.querySelectorAll("img.thumbnail").forEach(($img) => {
      if (!$img.getAttribute("data-load-listener-attached")) {
        $img.addEventListener("load", function() {
          this.style.display = "block";
          const $prev = this.previousElementSibling;
          if ($prev && $prev.classList.contains("skeleton-thumbnail")) {
            $prev.style.display = "none";
          }
        });
        $img.setAttribute("data-load-listener-attached", "true");
      }
    });
  }
  attachMovieItemEvents(state) {
    this.$container.querySelectorAll("li[data-movie-id]").forEach(($li) => {
      if (!$li.getAttribute("data-listener-attached")) {
        $li.addEventListener("click", () => {
          const movieIdString = $li.getAttribute("data-movie-id");
          const movie = state.movies.find(
            (movie2) => movie2.id.toString() === movieIdString
          );
          if (movie) this.$modal.open(movie.id);
        });
        $li.setAttribute("data-listener-attached", "true");
      }
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
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
};
const isPossibleLoadPopularMovies = (state) => {
  return !state.query && state.movies.length < MOVIE_COUNT.MAX_PAGE * MOVIE_COUNT.UNIT;
};
const isPossibleLoadSearchedMovies = (state) => {
  return state.query !== "" && state.movies.length < state.searchedMoviesLength;
};
const getCurrentPage = (moviesLength, unit) => {
  return Math.floor(moviesLength / unit) + 1;
};
const getCurrentScore = (id, store) => {
  var _a;
  const scores = store.getState().starRatings || [];
  return ((_a = scores.find((rating) => rating.id === id)) == null ? void 0 : _a.score) || 0;
};
async function withLoading(store, asyncFunc) {
  store.setState({ loading: true });
  try {
    const result = await asyncFunc();
    return result;
  } finally {
    store.setState({ loading: false });
  }
}
const ALLOWED_RATINGS = [2, 4, 6, 8, 10];
const Rating = (initialScore = 0) => {
  const score = ALLOWED_RATINGS.includes(initialScore) ? initialScore : 0;
  const scoreMessage = SCORE_MESSAGES[score];
  const labelsHTML = ALLOWED_RATINGS.map(
    (val) => (
      /* html */
      `
    <label for="star${val}" class="rating__label ${val === 0 ? "" : "rating__label--full"}" data-testid="star${val}">
      <input type="radio" id="star${val}" class="rating__input" name="rating" value="${val}">
      <span class="star-icon"></span>
    </label>`
    )
  ).join("");
  return (
    /* html */
    `
    <div class="rating" data-testid="rating">
      <div class="rating-bar">
        ${labelsHTML}
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
  const currentScore = ((_a = scores.find((rating) => rating.id === movieId)) == null ? void 0 : _a.score) || 0;
  const $radio = $rateWrap.querySelector(
    `#star${currentScore}`
  );
  if ($radio) $radio.checked = true;
  const stars = $rateWrap.querySelectorAll(".star-icon");
  const initStars = () => {
    stars.forEach(($star) => $star.classList.remove("filled"));
  };
  const checkedRate = () => {
    const $checkedRadio = $rateWrap.querySelector(
      '.rating input[type="radio"]:checked'
    );
    initStars();
    if ($checkedRadio) {
      const starLabels = Array.from($rateWrap.querySelectorAll("label"));
      const index = starLabels.findIndex(
        ($label) => $label.contains($checkedRadio)
      );
      for (let i = 0; i <= index; i++) {
        const $icon = starLabels[i].querySelector(".star-icon");
        if ($icon) $icon.classList.add("filled");
      }
    }
  };
  const saveRate = () => {
    const $checkedRadio = $rateWrap.querySelector(
      '.rating input[type="radio"]:checked'
    );
    if ($checkedRadio) {
      const newScore = Number($checkedRadio.value);
      let starRatings = store.getState().starRatings || [];
      const index = starRatings.findIndex((rating) => rating.id === movieId);
      if (index !== -1) {
        starRatings[index].score = newScore;
      } else {
        starRatings.push({ id: movieId, score: newScore });
      }
      localStorage.setItem("starRatings", JSON.stringify(starRatings));
      store.setState({ starRatings });
    }
  };
  checkedRate();
  stars.forEach(($starIcon) => {
    $starIcon.addEventListener("click", () => {
      setTimeout(() => {
        checkedRate();
        saveRate();
      }, 0);
    });
  });
};
class Modal {
  constructor(store, contentGenerator) {
    __publicField(this, "store");
    __publicField(this, "contentGenerator");
    __publicField(this, "$modalBackground");
    __publicField(this, "$closeButton");
    __publicField(this, "$modalContainer");
    __publicField(this, "currentMovieId", null);
    this.store = store;
    this.contentGenerator = contentGenerator;
    this.$modalBackground = document.querySelector("#modal-background");
    this.$closeButton = document.querySelector("#close-modal");
    this.$modalContainer = this.$modalBackground.querySelector("#modal-container");
    this.bindEvents();
    this.store.subscribe(() => {
      if (this.isOpen() && this.currentMovieId !== null) {
        this.updateRating();
      }
    });
  }
  bindEvents() {
    this.$closeButton.addEventListener("click", this.close.bind(this));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
    this.$modalBackground.addEventListener("click", (e) => {
      if (e.target === this.$modalBackground) this.close();
    });
  }
  open(movieId) {
    this.currentMovieId = movieId;
    this.contentGenerator(movieId, this.store).then((contentHTML) => {
      renderTemplate(this.$modalContainer, contentHTML);
      this.$modalBackground.classList.add("active");
      this.attachThumbnailLoadEvent(this.$modalContainer);
    });
  }
  updateRating() {
    var _a;
    if (this.currentMovieId) {
      const $ratingContainer = this.$modalContainer.querySelector("#modal-rating");
      if ($ratingContainer) {
        const scores = this.store.getState().starRatings || [];
        const currentScore = ((_a = scores.find((rating) => rating.id === this.currentMovieId)) == null ? void 0 : _a.score) || 0;
        renderTemplate($ratingContainer, Rating(currentScore));
        attachRatingEvents(this.currentMovieId, this.store);
      }
    }
  }
  isOpen() {
    return this.$modalBackground.classList.contains("active");
  }
  close() {
    this.$modalBackground.classList.remove("active");
    this.currentMovieId = null;
  }
  attachThumbnailLoadEvent($container) {
    const $thumbnail = $container.querySelector(
      "img.detail-thumbnail"
    );
    if (!$thumbnail) return;
    if (!$thumbnail.getAttribute("data-load-listener-attached")) {
      $thumbnail.addEventListener("load", function() {
        this.style.display = "block";
        const $prev = this.previousElementSibling;
        if ($prev && $prev.classList.contains("skeleton-detail-thumbnail")) {
          $prev.style.display = "none";
        }
      });
      $thumbnail.setAttribute("data-load-listener-attached", "true");
    }
  }
}
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
      <p class="detail">${movie.overview || "줄거리 정보가 없습니다."}</p>
    </div>
  `
  );
  setTimeout(() => {
    attachRatingEvents(id, store);
  }, 0);
  return contentHTML;
};
class App {
  constructor($target) {
    __publicField(this, "$target");
    __publicField(this, "store");
    __publicField(this, "$bannerContainer");
    __publicField(this, "$mainContainer");
    __publicField(this, "$bannerComponent");
    __publicField(this, "$movieListComponent");
    this.$target = $target;
    this.store = new Store({
      movies: [],
      query: "",
      searchedMoviesLength: 0,
      loading: false,
      starRatings: localStorage.getItem("starRatings") ? JSON.parse(localStorage.getItem("starRatings")) : []
    });
    appendHTML(this.$target, Header(this.store));
    this.$bannerContainer = document.createElement("section");
    this.$bannerContainer.id = "banner-container";
    this.$target.appendChild(this.$bannerContainer);
    this.$mainContainer = document.createElement("section");
    this.$mainContainer.classList.add("container");
    this.$target.appendChild(this.$mainContainer);
    appendHTML(this.$target, Footer());
    const $modal = new Modal(this.store, modalContentTemplate);
    this.$bannerComponent = new Banner(
      this.$bannerContainer,
      this.store,
      $modal
    );
    this.$movieListComponent = new MovieList(
      this.$mainContainer,
      this.store,
      $modal
    );
    if (this.store.getState().movies.length === 0) {
      this.loadPopularMovies();
    }
    this.attachScrollEvent(this.store);
  }
  async loadPopularMovies() {
    this.store.setState({ loading: true });
    const movies = await fetchPopularMovies(
      (error) => alert(error.message)
    );
    this.store.setState({ movies, loading: false });
  }
  attachScrollEvent(store) {
    window.addEventListener(
      "scroll",
      debounce(async () => {
        if (isScrolledToBottom()) {
          const state = store.getState();
          if (state.loading) return;
          const currentPage = getCurrentPage(
            state.movies.length,
            MOVIE_COUNT.UNIT
          );
          const $ul = this.$mainContainer.querySelector("#movie-list");
          appendHTMLs(
            $ul,
            Array.from({ length: MOVIE_COUNT.UNIT }, SkeletonMovieItem).join("")
          );
          if (isPossibleLoadPopularMovies(state)) {
            this.store.setState({ loading: true });
            const newMovies = await withLoading(
              store,
              () => fetchPopularMovies(
                (error) => alert(error.message),
                currentPage
              )
            );
            store.setState({
              movies: [...state.movies, ...newMovies],
              loading: false
            });
          } else if (isPossibleLoadSearchedMovies(state)) {
            this.store.setState({ loading: true });
            const newMoviesData = await withLoading(
              store,
              () => fetchSearchedMovies(
                state.query,
                (error) => alert(error.message),
                currentPage
              )
            );
            store.setState({
              movies: [...state.movies, ...newMoviesData.results],
              loading: false
            });
          }
          $ul.querySelectorAll(".skeleton-item").forEach(($li) => $li.remove());
        }
      }, 200)
    );
  }
}
const $app = document.querySelector("#wrap");
new App($app);
