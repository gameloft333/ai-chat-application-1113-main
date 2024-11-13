const characterSlice = createSlice({
  name: 'character',
  initialState: {
    selectedId: null,
    popularityText: ''
  },
  reducers: {
    setSelectedCharacter: (state, action) => {
      state.selectedId = action.payload;
      // 更新文字逻辑
    }
  }
}); 