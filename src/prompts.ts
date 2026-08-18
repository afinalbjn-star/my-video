interface Prompt {
  id: string;
  judul: string;
  deskripsi: string;
}

class Prompts {
  list: Prompt[] = [
    { id: '1', judul: 'Video Animasi 1', deskripsi: 'Video animasi tentang...' },
    { id: '2', judul: 'Video Animasi 2', deskripsi: 'Video animasi tentang...' },
    { id: '3', judul: 'Video Animasi 3', deskripsi: 'Video animasi tentang...' },
  ]
}
