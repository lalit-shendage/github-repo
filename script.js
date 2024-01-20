const API_URL = 'https://api.github.com/users/';
let currentPage = 1;
let repositoriesPerPage = 10;
let currentUsername = getUsernameFromUrl() || 'lalit-shendage'; 

function showLoader() {
    $('#loader').show();
}

function hideLoader() {
    $('#loader').hide();
}

// Userinfo
function displayUserInfo(user) {
    $('#userImage').attr('src', user.avatar_url);
    $('#userName').text(user.name || user.login);
    $('#userBio').text(user.bio || 'No bio available');

    const userLinks = $('#userLinks');
    userLinks.empty();

    if (user.location) {
        userLinks.append(`<li><strong>Location:</strong> ${user.location}</li>`);
    }

    const bioLinks = extractBioLinks(user.bio);
    bioLinks.forEach(link => {
        userLinks.append(`<li><a href="${link.url}" target="_blank">${link.name}</a></li>`);
    });

    userLinks.append(`<li><a href="${user.html_url}" target="_blank">${user.html_url}</a></li>`);
}

function extractBioLinks(bio) {
    const regex = /(https?:\/\/[^\s]+)/g;
    const matches = bio.match(regex) || [];
    return matches.map(url => ({ name: url, url }));
}

// for displaying public repos
function displayRepositories(repositories) {
    const repositoriesDiv = $('#repositories');
    repositoriesDiv.empty();

    repositories.forEach(repo => {
        fetchRepositoryLanguages(`${repo.languages_url}?per_page=10`, languages => {
            const languagesList = Object.keys(languages);

            const repositoryCard = `
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${repo.name}</h5>
                            <p class="card-text">${repo.description || 'No description available'}</p>
                        </div>
                        <ul class="nav nav-tabs" id="languageTabs-${repo.id}">
                            ${languagesList.map(language => `<li class="nav-item lang"><a class="nav-link page-link " data-toggle="tab" href="#${language}-tab">${language}</a></li>`).join('')}
                        </ul>
                        <div class="tab-content">
                            ${languagesList.map(language => `
                                <div class="tab-pane fade page-link" id="${language}-tab">
                                    <div class="list-group list-group-flush">
                                        <li class="list-group-item "><strong>Languages:</strong> ${languages[language] || 'Not specified'}</li>
                                    </div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            repositoriesDiv.append(repositoryCard);
        });
    });

// pagination

    const paginationDiv = $('#pagination');
    paginationDiv.empty();

    const previousPageItem = $('<li>').addClass('page-item').attr('id', 'previousPage');
    const previousPageLink = $('<a>').addClass('page-link').attr('aria-label', 'Previous').text('« Previous').click(() => {
        changePage(currentPage - 1);
    });
    previousPageItem.append(previousPageLink);
    paginationDiv.append(previousPageItem);

    const currentPageItem = $('<li>').addClass('page-item disabled').attr('id', 'currentPage');
    const currentPageLink = $('<span>').addClass('page-link').text(currentPage);
    currentPageItem.append(currentPageLink);
    paginationDiv.append(currentPageItem);

    const nextPageItem = $('<li>').addClass('page-item').attr('id', 'nextPage');
    const nextPageLink = $('<a>').addClass('page-link').attr('aria-label', 'Next').text('Next »').click(() => {
        changePage(currentPage + 1);
    });
    nextPageItem.append(nextPageLink);
    paginationDiv.append(nextPageItem);

    repositories.forEach(repo => {
        $(`#languageTabs-${repo.id} a:first`).tab('show');
    });
}

// fetching datafrom github api
function fetchUserData() {
    showLoader();

    const url = `${API_URL}${currentUsername}`;
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            hideLoader();
            displayUserInfo(data);
            fetchRepositories();
        },
        error: function (xhr) {
            hideLoader();
            alert(`Error: ${xhr.responseJSON.message}`);
        }
    });
}

function fetchRepositories() {
    showLoader();

    const url = `${API_URL}${currentUsername}/repos?page=${currentPage}&per_page=${repositoriesPerPage}`;

    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            hideLoader();
            displayRepositories(data);
        },
        error: function (xhr) {
            hideLoader();
            alert(`Error: ${xhr.responseJSON.message}`);
        }
    });
}

function fetchRepositoryLanguages(languagesUrl, callback) {
    $.ajax({
        url: languagesUrl,
        method: 'GET',
        success: function (data) {
            callback(data);
        },
        error: function (xhr) {
            console.error(`Error fetching repository languages: ${xhr.responseJSON.message}`);
            callback({});
        }
    });
}

function changePage(newPage) {
    if (newPage >= 1) {
        currentPage = newPage;
        fetchRepositories();
    }
}

// fetching username from url if another username is provided
function getUsernameFromUrl() {
    const hash = window.location.hash;
    const username = hash.slice(1); 
    return username || null;
}

$(document).ready(function () {
    fetchUserData();

    $('#reposPerPageSelect').change(function () {
        repositoriesPerPage = parseInt($(this).val());
        currentPage = 1; 
        fetchRepositories();
    });

    $(window).on('hashchange', function () {
        currentUsername = getUsernameFromUrl() || 'lalit-shendage';
        fetchUserData();
    });
});
