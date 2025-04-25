

function parseUserData(jsonString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    const postIdRegex = /^p\d+$/;

    function customReviver(key, value) {
        // Date conversion
        if (typeof value === 'string' && dateRegex.test(value)) {
            return new Date(value);
        }

        // Number conversion
        if (key === 'views' || key === 'likes') {
            return parseInt(value, 10);
        }

        // Preference validation
        if (key === 'preferences') {
            if (!['light', 'dark'].includes(value.theme)) {
                value.theme = 'light';
            }
            return value;
        }

        // Post filtering
        if (key === 'posts') {
            return value.filter(post => postIdRegex.test(post.id));
        }

        return value;
    }

    const parsedData = JSON.parse(jsonString, customReviver);

    // Validate required fields
    if (!parsedData.user?.id) {
        throw new Error("Invalid user: missing ID");
    }

    // Add computed properties
    parsedData.user.postCount = parsedData.user.posts?.length || 0;

    return parsedData;
}

function displayResult(data) {
    const outputDiv = document.getElementById('output');

    if (data.error) {
        outputDiv.innerHTML = `<span class="error">${data.error}</span>`;
        return;
    }

    let html = `<h3 class="success">Parsed Successfully</h3>`;

    html += `<pre>${JSON.stringify(data, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString(); // or value.toLocaleString();;
        }
        return value;
    }, 2)}</pre>`;

    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, match => {
                   if (/^"/.test(match)) {
                       if (/:$/.test(match)) {
                           return `<span style="color: #9B59B6;">${match}</span>`;
                       }
                       return `<span style="color: #E74C3C;">${match}</span>`;
                   }
                   if (/^(true|false)$/.test(match)) {
                       return `<span style="color: #3498DB;">${match}</span>`;
                   }
                   if (/null/.test(match)) {
                       return `<span style="color: #7F8C8D;">${match}</span>`;
                   }
                   return match;
               });

    outputDiv.innerHTML = html;

    // Display additional formatted information
    outputDiv.innerHTML += `
        <h4>Formatted information:</h4>
        <p><strong>User:</strong> ${data.user.name} (ID: ${data.user.id})</p>
        <p><strong>Registered:</strong> <span class="number">${data.user.registrationDate.toLocaleDateString()}</span></p>
        <p><strong>Theme:</strong> ${data.user.preferences.theme}</p>
        <p><strong>Post Count:</strong> <span class="number">${data.user.postCount}</span></p>
    `;
}

document.getElementById('parseBtn').addEventListener('click', function () {
    fetch('data.json')
      .then(response => response.json())
      .then(jsonData => {
        const results = parseUserData(JSON.stringify(jsonData));
        displayResult(results);
      })
      .catch(error => {
        document.getElementById('output').innerHTML = `<span class="error">Error: ${error.message}</span>`;
      });
  });
  