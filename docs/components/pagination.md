# Pagination

Display pagination bar in order to display multiple pages of content.

Usage:

```html
<hpagination
    data=paginationData
    currentPage=state.currentPage
    on-page-click("onExamplePageClick")/>
```

## Pagination Data

Pagination data is a simple array of numbers and *"..."*.

```javascript
[1, 2, 3, "...", 14, 15]
```

Example method to generate pagination data (in this example, current page is set by *currentPage*, total number of pages is set by *totalPages*):

```javascript
generatePagination(currentPage, totalPages) {
    const center = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    const filteredCenter = center.filter((p) => p > 1 && p < totalPages);
    // includeThreeLeft
    if (currentPage === 5) {
        filteredCenter.unshift(2);
    }
    // includeThreeRight
    if (currentPage === totalPages - 4) {
        filteredCenter.push(totalPages - 1);
    }
    // includeLeftDots
    if (currentPage > 5) {
        filteredCenter.unshift("...");
    }
    // includeRightDots
    if (currentPage < totalPages - 4) {
        filteredCenter.push("...");
    }
    // Finalize
    const pagination = [1, ...filteredCenter, totalPages];
    if (pagination.join(",") === "1,1") {
        pagination.pop();
    }
    // Return pagination data
    return pagination;
}
```