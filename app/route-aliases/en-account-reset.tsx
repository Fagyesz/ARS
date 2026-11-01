// Its own module: two routes on one file make typegen write one types file
// twice at once, which can corrupt it and fail the typecheck.
export {action, default} from '../routes/account_.reset.$id.$token';
