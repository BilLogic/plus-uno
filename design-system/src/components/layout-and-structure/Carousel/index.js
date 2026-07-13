import Carousel from './Carousel';
import { CarouselItem, CarouselCaption } from 'react-bootstrap';

// Attach subcomponents for convenience if users want to compose manually
Carousel.Item = CarouselItem;
Carousel.Caption = CarouselCaption;

export { Carousel };
export default Carousel;
