let animeList = []; // Store the original anime list from the uploaded JSON
let filteredList = []; // Store the filtered list of anime with start date in 2024
let processedData = []; // Store the final processed data (original + fetched API data)

// Enable the process button when a file is selected

document.querySelector(".btn").addEventListener("click", async function () {
  // Show the loading indicator
  document.getElementById("loadingIndicator").style.display = "block";
  document
    .getElementById("loadingIndicator")
    .querySelector(
      "p"
    ).textContent = `processing your anime list, please wait... (this may take some time if you have long entries on you mal)`;
  const username = document.getElementById("username").value;
  const animeList = await fetchAnimeList(username);

  // Filter anime that started in 2024
  const filteredList = animeList.filter((item) => {
    const startDate = item.list_status.start_date;
    return startDate && startDate.includes("2024");
  });

  // Process the filtered anime list and fetch data from the API
  for (const anime of filteredList) {
    const fetchedData = await fetchAnimeData(anime.node.id);
    const animeData = {
      ...anime, // Keep the original data
      fetchedData: fetchedData || {}, // Add the fetched data (if available)
    };
    processedData.push(animeData);

    // Add a delay of 0.5 seconds between API calls to respect the rate limit
    await delay(700);
  }

  // The data is now in processedData and can be used for further operations.
  console.log("Processed Data:", processedData);
  console.log();
  // Summarize the data

  let totalAnime = processedData.length;
  let currentlyWatching = 0;
  let droppedShows = 0;
  let onHoldShows = 0;
  let myRatings = 0;
  let myRatingsList = [];
  let overallRating = 0;
  let overallRatingList = [];
  let totalEpisodes = 0;
  let genres = {};
  let studios = {};
  let source = {};
  let themes = {};
  let topShows = [];
  let leastPopularAnime = "";
  let leastMembers;
  let longestStreak;
  let monthlyAnime = {};
  let completedShows = 0;
  let peakDay;
  const dayActivity = {};
  let maxEpisodes = 0;

  for (let i = 0; i < totalAnime; i++) {
    const data = processedData[i];
    // currentlyWatching
    if (data.list_status.status === "Watching") {
      currentlyWatching++;
    }
    // Dropped shows
    if (data.list_status.status === "Dropped") {
      droppedShows++;
    }
    // On hold shows
    if (data.list_status.status === "On-Hold") {
      onHoldShows++;
    }

    // peak day
    const startDate = data.list_status.start_date
      ? data.list_status.start_date
      : "0000-00-00";
    const finishDate = data.list_status.finish_date
      ? data.list_status.finish_date
      : "0000-00-00";
    const episodes = data.list_status.num_episodes_watched;

    if (startDate !== "0000-00-00" && finishDate !== "0000-00-00") {
      // Increment episodes watched on the start date
      dayActivity[startDate] = (dayActivity[startDate] || 0) + episodes;

      // Increment episodes watched on the finish date
      dayActivity[finishDate] = (dayActivity[finishDate] || 0) + episodes;
    }

    // least popular anime
    if (data.list_status.status == "completed") {
      leastMembers = parseInt(data.fetchedData.members);
      completedShows++;
      for (let j = 0; j < totalAnime; j++) {
        if (parseInt(processedData[j].fetchedData.members) < leastMembers) {
          leastMembers = parseInt(processedData[j].fetchedData.members);
          leastPopularAnime = processedData[j].node.title;
        }
      }
    }

    // longest streak
    if (data.list_status.status == "completed") {
      let streak = 0;
      let streakList = [];
      for (let j = 0; j < totalAnime; j++) {
        if (processedData[j].list_status.status == "completed") {
          streak++;
        } else {
          streakList.push(streak);
          streak = 0;
        }
      }
      longestStreak = Math.max(...streakList);
    }

    // monthly anime
    const month = startDate.split("-")[1];
    if (monthlyAnime[month]) {
      monthlyAnime[month]++;
    } else {
      monthlyAnime[month] = 1;
    }

    // myRatings
    if (data.list_status.score !== 0) {
      myRatings += parseInt(data.list_status.score);
      myRatingsList.push(data.list_status.score);
      if (data.list_status.score == 10) {
        topShows.push(data.node.title);
      }
    }
    // overallRating
    if (data.fetchedData.score) {
      overallRating += data.fetchedData.score;
      overallRatingList.push(data.fetchedData.score);
    }
    // totalEpisodes
    totalEpisodes += data.list_status.num_episodes_watched;

    // genres with numbers
    for (let j = 0; j < data.fetchedData.genres.length; j++) {
      if (genres[data.fetchedData.genres[j].name]) {
        genres[data.fetchedData.genres[j].name]++;
      } else {
        genres[data.fetchedData.genres[j].name] = 1;
      }
    }
    // studios with numbers
    for (let j = 0; j < data.fetchedData.studios.length; j++) {
      if (studios[data.fetchedData.studios[j].name]) {
        studios[data.fetchedData.studios[j].name]++;
      } else {
        studios[data.fetchedData.studios[j].name] = 1;
      }
    }
    // themes with numbers
    for (let j = 0; j < data.fetchedData.themes.length; j++) {
      if (themes[data.fetchedData.themes[j].name]) {
        themes[data.fetchedData.themes[j].name]++;
      } else {
        themes[data.fetchedData.themes[j].name] = 1;
      }
    }

    // source with numbers
    if (source[data.fetchedData.source]) {
      source[data.fetchedData.source]++;
    } else {
      source[data.fetchedData.source] = 1;
    }
  }

  // peak day
  for (const [day, episodes] of Object.entries(dayActivity)) {
    if (episodes > maxEpisodes) {
      peakDay = day;
      maxEpisodes = episodes;
    }
  }

  // sorting genres/studios/sources/themes in descesding order
  genres = Object.fromEntries(
    Object.entries(genres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  );
  studios = Object.fromEntries(
    Object.entries(studios)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  );
  source = Object.fromEntries(
    Object.entries(source)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  );
  themes = Object.fromEntries(
    Object.entries(themes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  );

  // remove similar type of entries from topShows
  const topAnime = removeSimilarEntries(topShows);

  const container = document.querySelector(".container");
  container.innerHTML = `
    <header class="header">
        <h1>This year, you watched</h1>
        <h2><span id="total-anime">${totalAnime}</span> Anime</h2>
        <p>
          with a total watch time of
          <span id="total-watch-time">${(totalEpisodes * 24) / 60} hours</span>.
        </p>
      </header>
      
      <section class="top-genres">
        <h2>Top Genres</h2>
        <ul id="genre-list">
        </ul>
      </section>

      <section class="top-themes">
        <h2>Top Themes</h2>
        <ul id="theme-list">
        </ul>
      </section>

      <section class="top-studios">
        <h2>Top Studios</h2>
        <ul id="studio-list">
        </ul>
      </section>

      <div class="chart-container">
        <h2>Anime Watched Monthly</h2>
        <canvas id="barChart"></canvas>
      </div>

      <section class="peak-day">
        <h2>Peak Day</h2>
        <p>
          Your most active day was <strong>${peakDay}</strong>
        </p>
      </section>

      <section class="longest-streak">
        <h2>Longest Streak</h2>
        <p>Longest streak of watching anime: <strong>${longestStreak}</strong>.</p>
      </section>

      <section class="top-rated">
        <h2>Top Rated Anime</h2>
        <p>Your highest-rated anime this year was</p>
        <ul id="top-rated-list">
        </ul>
      </section>

      <section class="lower-popular">
        <h2>Least Popular Anime</h2>
        <p>
          You became part of an anime known by ${leastMembers} members,
          <strong>${leastPopularAnime}</strong>.
        </p>
      </section>

      <section class="avg-score">
        <h2>Your Score vs Overall Score Comparison</h2>
        <p>Your average score: <strong>${(
          myRatings / myRatingsList.length
        ).toFixed(2)}</strong></p>
        <p>Community average score: <strong>${(
          overallRating / overallRatingList.length
        ).toFixed(2)}</strong></p>
        <canvas id="scoreChart"></canvas>
      </section>

      <div class="recap-container" id="recap">
        <!-- Header -->
        <div class="recap-header">
          <h1>Anime Recap 2024</h1>
        </div>

        <!-- Stats -->
        <div class="stat-summary">
          <div class="stat-box">
            <h2>${totalAnime}</h2>
            <p>Anime</p>
          </div>
          <div class="stat-box">
            <h2>${(totalEpisodes * 24) / 60}h</h2>
            <p>Watch Time</p>
          </div>
          <div class="stat-box">
            <h2>${(myRatings / myRatingsList.length).toFixed(2)}</h2>
            <p>Avg Score</p>
          </div>
        </div>

        <!-- Top Lists -->
        <div class="top-section">
          <div class="top-lists">
            <div class="list" id="top-genres-recap">
              <h3>Top Genres</h3>
            </div>
            <div class="list" id="top-studios-recap">
              <h3>Top Studios</h3>
            </div>
            <div class="list" id="top-rated-recap">
              <h3>Top Rated Anime</h3>
            </div>
            <div class="list" id="top-themes-recap">
              <h3>Top Themes</h3>
            </div>
            <div class="list">
              <h3>
                Least Popular Anime ${leastPopularAnime}
              </h3>
            </div>
            <div class="list">
              <h3>Longest Streak Watching: ${longestStreak} </h3>
            </div>
            <div class="list">
              <h3>Peak Day: ${peakDay}</h3>
            </div>
          </div>
        </div>
      </div>
      <button onclick="downloadRecap()">Download Recap</button>`;

  // Display the lists
  const genreList = document.getElementById("genre-list");
  const themeList = document.getElementById("theme-list");
  const studioList = document.getElementById("studio-list");
  const topRatedList = document.getElementById("top-rated-list");
  const topGenresRecap = document.getElementById("top-genres-recap");
  const topThemesRecap = document.getElementById("top-themes-recap");
  const topStudiosRecap = document.getElementById("top-studios-recap");
  const topRatedRecap = document.getElementById("top-rated-recap");

  for (const [genre, count] of Object.entries(genres)) {
    const listItem = document.createElement("li"); // Create a <li> element
    listItem.textContent = `${genre}: ${count}`; // Set the text content
    genreList.appendChild(listItem); // Append the list item to the <ul>
  }
  // Top Themes
  for (const [theme, count] of Object.entries(themes)) {
    const listItem = document.createElement("li"); // Create a <li> element
    listItem.textContent = `${theme}: ${count}`; // Set the text content
    themeList.appendChild(listItem); // Append the list item to the <ul>
  }
  // Top Studios
  for (const [studio, count] of Object.entries(studios)) {
    const listItem = document.createElement("li"); // Create a <li> element
    listItem.textContent = `${studio}: ${count}`; // Set the text content
    studioList.appendChild(listItem); // Append the list item to the <ul>
  }
  // Top Rated Anime
  for (const anime of topAnime) {
    const listItem = document.createElement("li"); // Create a <li> element
    listItem.textContent = anime; // Set the text content
    topRatedList.appendChild(listItem); // Append the list item to the <ul>
  }
  // Top Rated Recap
  for (const anime of topAnime) {
    const listItem = document.createElement("div"); // Create a <div> element
    listItem.className = "list-item"; // Add a class
    listItem.textContent = anime; // Set the text content
    topRatedRecap.appendChild(listItem); // Append the list item to the <div>
  }
  // Top Genres Recap
  for (const [genre, count] of Object.entries(genres)) {
    const listItem = document.createElement("div"); // Create a <div> element
    listItem.className = "list-item"; // Add a class
    listItem.textContent = `${genre}`; // Set the text content
    topGenresRecap.appendChild(listItem); // Append the list item to the <div>
  }
  // Top Themes Recap
  for (const [theme, count] of Object.entries(themes)) {
    const listItem = document.createElement("div"); // Create a <div> element
    listItem.className = "list-item"; // Add a class
    listItem.textContent = `${theme}`; // Set the text content
    topThemesRecap.appendChild(listItem); // Append the list item to the <div>
  }
  // Top Studios Recap
  for (const [studio, count] of Object.entries(studios)) {
    const listItem = document.createElement("div"); // Create a <div> element
    listItem.className = "list-item"; // Add a class
    listItem.textContent = `${studio}`; // Set the text content
    topStudiosRecap.appendChild(listItem); // Append the list item to the <div>
  }

  // Create a bar chart for monthly anime
  console.log(
    "completedShows",
    completedShows,
    "watching",
    currentlyWatching,
    "dropped",
    droppedShows,
    "onHold",
    onHoldShows
  );
  const monthlyData = Object.values(monthlyAnime);
  const monthNames = {
    "00": "Undefined",
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    10: "October",
    11: "November",
    12: "December",
  };
  const labels = Object.keys(monthlyAnime)
    .sort((a, b) => a - b) // Sort keys numerically
    .map((key) => monthNames[key]); // Map keys to month names

  const values = Object.keys(monthlyAnime)
    .sort((a, b) => a - b) // Sort keys numerically
    .map((key) => monthlyAnime[key]); // Get corresponding values

  // bar chart
  const barChartCtx = document.getElementById("barChart").getContext("2d");
  const barChart = new Chart(barChartCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Anime Watched",
          data: values, // Example Data
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Monthly Anime Watched (2024)",
          font: {
            size: 16,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 5,
          },
        },
      },
    },
  });

  // line chart for scoreChart
  const scoreChartCtx = document.getElementById("scoreChart").getContext("2d");
  const scoreChart = new Chart(scoreChartCtx, {
    type: "line",
    data: {
      labels: myRatingsList,
      datasets: [
        {
          label: "Your Score",
          data: myRatingsList, // Example Data
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Overall Score",
          data: overallRatingList, // Example Data
          backgroundColor: "rgba(192, 75, 75, 0.6)",
          borderColor: "rgba(192, 75, 75, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: "Your Score vs Overall Score Comparison",
          font: {
            size: 16,
          },
        },
      },
      scales: {
        y: {
          min: 5,
          max: 10,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });

  // Disable the button and hide the loading indicator after processing
  document.querySelector(".header").style.display = "none";
  document.getElementById("loadingIndicator").style.display = "none";
});

// Fetch user AnimeList
async function fetchAnimeList(username) {
  const animeList = [];
  const corsProxy = "https://cors-anywhere-mn0f.onrender.com/";
  const baseUrl = `${corsProxy}api.myanimelist.net:443/v2/users/${username}/animelist?fields=list_status&nsfw=true`;
  let nextUrl = baseUrl; // Start with the base URL and params

  const headers = {
    "Content-Type": "application/json",
    "X-MAL-CLIENT-ID": "a4126bcedef78e592db3e280720a9fa1",
  };

  while (nextUrl) {
    try {
      // Ensure the nextUrl includes the corsProxy prefix
      const url = nextUrl.startsWith(corsProxy)
        ? nextUrl
        : `${corsProxy}${nextUrl}`;

      console.log("Fetching data from", url);

      // Make the API request
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch data: ${response.status}, ${await response.text()}`
        );
        break;
      }

      const data = await response.json();
      animeList.push(...(data.data || [])); // Add current page data to the list

      // Update the next URL from the paging info
      if (data.paging?.next) {
        nextUrl = data.paging.next;
      } else {
        nextUrl = null;
      }

      console.log(
        `Fetched ${data.data?.length || 0} items. Total so far: ${
          animeList.length
        }`
      );
    } catch (error) {
      console.error(`Error fetching data: ${error.message}`);
      break;
    }
  }

  return animeList;
}

// Fetch data from the Jikan API
async function fetchAnimeData(animeId) {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
    const data = await response.json();
    return data.data ? data.data : null;
  } catch (error) {
    console.error("Error fetching data for anime ID " + animeId, error);
    return null;
  }
}

// Delay function to add a 0.5-second wait
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeSimilarEntries(animeList) {
  const mergedList = [];
  const seen = new Set();
  console.log(animeList);
  animeList.forEach((title) => {
    console.log(title);
    // Generate a simplified version of the title for comparison
    const simplifiedTitle = title;

    mergedList.push(simplifiedTitle);
  });

  return mergedList;
}

window.downloadRecap = function () {
  const recapElement = document.getElementById("recap");
  html2canvas(recapElement).then((canvas) => {
    const link = document.createElement("a");
    link.download = "anime_recap_2024.png";
    link.href = canvas.toDataURL();
    link.click();
  });
};
