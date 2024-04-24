import { async } from 'regenerator-runtime';
import { API_URL, KEY, RESULT_PER_PAGE } from './config.js';
import { AJAX } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RESULT_PER_PAGE,
  },
  bookmarks: [],
};

const createRecipes = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    image: recipe.image_url,
    ingredients: recipe.ingredients,
    servings: recipe.servings,
    sourceUrl: recipe.source_url,
    publisher: recipe.publisher,
    cookingTime: recipe.cooking_time,
    title: recipe.title,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id} `);

    state.recipe = createRecipes(data);
    // to bookmark the data
    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;
    //console.log(state.recipe);
  } catch (err) {
    //console.log(err);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(
      `${API_URL}?search=${query}&key=a9b6ea31-ee71-4f30-9f82-95288b1b5966`
    ); //https://forkify-api.herokuapp.com/api/v2/recipes?search=pizza
    console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        image: rec.image_url,
        publisher: rec.publisher,
        title: rec.title,
        ...(rec.key && { key: rec.key }),
      };
    });

    state.search.page = 1;
    // console.log(state.search.results);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

//loadSearchResults('pizza');

export const getSearchResults = function (page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  //console.log(start, end);
  return state.search.results.slice(start, end);
};

const persisitBookmarks = function () {
  localStorage.setItem('bookmark', JSON.stringify(state.bookmarks));
};
export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    // oldquantity = (oldquantity * newservings) / oldservings
  });

  state.recipe.servings = newServings;

  persisitBookmarks();
};

export const addBookmarks = function (recipe) {
  state.bookmarks.push(recipe);

  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persisitBookmarks();
};

export const removeBookmarks = function (id) {
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);
  if (id === state.recipe.id) state.recipe.bookmarked = false;
};

const init = function () {
  const storage = localStorage.getItem('bookmark');
  if (storage) state.bookmarks = JSON.parse(storage);
};
init();

const clearBookmarks = function () {
  localStorage.clear('bookmark');
};

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        // const ingArr = ing[1].replaceAll('', '').split(',');
        console.log(ingArr);
        if (ingArr.length !== 3) {
          throw new Error(
            'wrong ingredient format ! please fill the format correctly:)'
          );
        }
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      publisher: newRecipe.publisher,
      image_url: newRecipe.image,
      servings: +newRecipe.servings,
      cooking_time: +newRecipe.cookingTime,
      ingredients,
    };

    console.log(recipe);
    const data = await AJAX(
      `https://forkify-api.herokuapp.com/api/v2/recipes/?key=a9b6ea31-ee71-4f30-9f82-95288b1b5966`,
      recipe
    );
    console.log(data);
    //state.recipe = createRecipes(data);
    addBookmarks(state.recipe);
  } catch (err) {
    throw err;
  }
};
