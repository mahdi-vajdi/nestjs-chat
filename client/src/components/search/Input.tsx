import CustomSearchInput from "components/Inputs/Search";

function SearchInput() {
  return (
    <CustomSearchInput
      size="large"
      enterButton={<span>search</span>}
      placeHolder="search..."
    />
  );
}

export default SearchInput;
