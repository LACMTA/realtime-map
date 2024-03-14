document.getElementById('legend-close').addEventListener('click', () => {
    document.getElementById('legend').style.display = 'none';
    document.getElementById('legend-mini').style.display = 'flex';

});

document.getElementById('legend-mini').addEventListener('click', () => {
    document.getElementById('legend').style.display = 'block';
    document.getElementById('legend-mini').style.display = 'none';
});