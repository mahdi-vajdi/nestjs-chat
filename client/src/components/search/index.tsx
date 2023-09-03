//  styles
import searchStyles from "./styles.module.scss";
//  components
import SearchInput from "./Input";

function Search() {
  return (
    <>
      <div className={searchStyles.SearchInputContainer}>
        <SearchInput />
      </div>
    </>
  );
}

export default Search;
