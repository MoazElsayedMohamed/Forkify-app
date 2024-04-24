import 'core-js/stable';
import 'regenerator-runtime/runtime';
import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/viewRecipe.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
//import addRecipeView from './views/addRecipeView.js';
import addRecipeView from './views/addRecipeView.js';

if (module.hot) {
  module.hot.accept();
}

const controlRecipe = async function () {
  try {
    const id = window.location.hash.slice(1); // het the id and fetching it

    if (!id) return;

    recipeView.renderSpinner();
    // 0)
    resultsView.update(model.getSearchResults());
    bookmarksView.update(model.state.bookmarks);

    //1) loading recipe form API
    await model.loadRecipe(id);
    //const { recipe } = model.state;

    // 2) rendering recipe
    recipeView.render(model.state.recipe);
    //    console.log(res, data);
  } catch (err) {
    recipeView.renderError();
  }
};
//controlRecipe();

const controlSearchResults = async function () {
  try {
    //1)
    resultsView.renderSpinner();
    const query = searchView.getQuery();
    if (!query) return;

    //2)
    await model.loadSearchResults(query);
    //3) render initial results
    console.log(model.state.search.results);
    // resultsView.render(model.state.search.results);
    resultsView.render(model.getSearchResults());

    //4)render initial pagination
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};
//controlSearchResults();

const controlPagination = function (goToPage) {
  //3)render new results
  resultsView.render(model.getSearchResults(goToPage));

  //4) render new paginaton
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // update serving of recipe
  model.updateServings(newServings);

  // recipeView.render(model.state.recipe);
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  if (!model.state.recipe.bookmarked) model.addBookmarks(model.state.recipe);
  else model.removeBookmarks(model.state.recipe.id);

  recipeView.update(model.state.recipe);

  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // render recipe view
    recipeView.render(model.state.recipe);

    // render bookmarks view
    bookmarksView.render(model.state.bookmarks);

    // change ID in url
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);

    addRecipeView.renderMessage();
  } catch (err) {
    console.error(err);
    addRecipeView.renderError(err.message);
  }
};

const init = function () {
  bookmarksView.addHandlerBookmark(controlBookmarks);
  recipeView.addHandlerRender(controlRecipe);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerPagination(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};
init();

// load and change the id of url and change the data that shown by change id

//window.addEventListener('hashchange', showReceipe);
