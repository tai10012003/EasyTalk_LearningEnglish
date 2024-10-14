const flashcardListId = document.getElementById('flashcard-list-id').value;

document.getElementById('newFlashcardForm').addEventListener('submit', function (event) {
  event.preventDefault();

  // Kiểm tra xem sự kiện submit có được kích hoạt không
  console.log('Form submitted');

  // Lấy dữ liệu từ form
  const word = document.getElementById('word').value;
  const meaning = document.getElementById('meaning').value;
  const pronunciation = document.getElementById('pronunciation').value;
  const exampleSentence = document.getElementById('exampleSentence').value;
  const image = document.getElementById('image').value;
  const pos = document.getElementById('pos').value;


  // Kiểm tra dữ liệu form
  console.log({ word, meaning, pos, pronunciation, exampleSentence, image }); // Thêm dòng này để kiểm tra
  console.log(flashcardListId);
  // Lấy id của flashcard list từ URL


  // Gửi yêu cầu POST đến server
  fetch(`/flashcards/flashcardlist/${flashcardListId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      word: word,
      meaning: meaning,
      pos: pos,
      pronunciation: pronunciation,
      exampleSentence: exampleSentence,
      image: image,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // Kiểm tra phản hồi từ server
      if (data.success) {
        alert('Từ mới đã được thêm thành công!');
        document.getElementById('newFlashcardForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addFlashcardModal'));
        modal.hide();
        location.reload();
      } else {
        alert('Có lỗi xảy ra: ' + data.message);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

// Lắng nghe sự kiện xóa flashcard
document.querySelectorAll('.delete-flashcard-btn').forEach(button => {
  button.addEventListener('click', function () {
    const flashcardId = this.getAttribute('data-flashcard-id');

    // Xác nhận người dùng có muốn xóa flashcard không
    if (confirm('Bạn có chắc chắn muốn xóa flashcard này không?')) {
      // Gửi yêu cầu DELETE tới server
      fetch(`/flashcards/delete-flashcard/${flashcardId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('Flashcard đã bị xóa thành công!');
            location.reload(); // Reload lại trang để cập nhật danh sách
          } else {
            alert('Xóa thất bại: ' + data.message);
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  });
});

document.getElementById('editFlashCardListForm').addEventListener('submit', function (event) {
  event.preventDefault();

  // Kiểm tra xem sự kiện submit có được kích hoạt không
  console.log('Form submitted');

  // Lấy dữ liệu từ form
  const name = document.getElementById('name').value;
  const description = document.getElementById('description').value;

  // Kiểm tra dữ liệu form
  console.log({ word, meaning, pronunciation, exampleSentence, image }); // Thêm dòng này để kiểm tra
  console.log(flashcardListId);
  // Lấy id của flashcard list từ URL

  // Gửi yêu cầu POST đến server
  fetch(`/flashcards/flashcardlist/${flashcardListId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      description: description
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // Kiểm tra phản hồi từ server
      if (data.success) {
        alert('Cập nhật thông tin list từ thành công!');
        document.getElementById('editFlashCardListForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editFlashcardListModal'));
        modal.hide(); // đóng modal
        location.reload();
      } else {
        alert('Có lỗi xảy ra: ' + data.message);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

function saveFlashcard(flashcardId) {
  const word = document.getElementById(`word-${flashcardId}`).value;
  const meaning = document.getElementById(`meaning-${flashcardId}`).value;
  const pos = document.getElementById(`pos-${flashcardId}`).value;
  const pronunciation = document.getElementById(`pronunciation-${flashcardId}`).value;
  const exampleSentence = document.getElementById(`exampleSentence-${flashcardId}`).value;
  const image = document.getElementById(`image-${flashcardId}`).value;

  const data = {
    word,
    meaning,
    pos,
    pronunciation,
    exampleSentence,
    image,
  };

  // Gửi yêu cầu PUT tới API để cập nhật flashcard
  fetch(`/flashcards/update-flashcard/${flashcardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Hiển thị thông báo thành công
        alert('Flashcard đã được cập nhật thành công.');
        // Tải lại trang để cập nhật danh sách flashcards
        window.location.reload();
      } else {
        alert('Đã có lỗi xảy ra khi cập nhật flashcard.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Đã có lỗi xảy ra khi cập nhật flashcard.');
    });
}