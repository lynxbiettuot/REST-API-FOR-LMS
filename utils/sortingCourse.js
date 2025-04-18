// Hàm để xử lý sort theo các tiêu chí
const sortByCriterial = (name, order) => {
    switch (name) {
        case 'price':
            return (a, b) => {
                return order === 'asc' ? a.price - b.price : b.price - a.price;
            };
        case 'title':
            return (a, b) => {
                return order === 'asc'
                    ? a.title.localeCompare(b.title)
                    : b.title.localeCompare(a.title);
            };
        // Thêm các tiêu chí khác nếu cần
        default:
            return () => 0; // Nếu không có tiêu chí sort, trả về hàm mặc định không làm gì
    }
};

module.exports = sortByCriterial;
