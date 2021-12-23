import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import {
  PlaceImagePayload,
  PlaceInfoResponsePayload
} from './payload/place.payload';
import {
  CoordinateResponsePayload,
  RecommendResponsePayload
} from './payload/recommend.payload';

@Injectable()
export class RecommendService {
  private readonly model_ip;
  private readonly kakaoapi;
  private readonly kakaoHeaders;
  private readonly tourapi;
  private readonly tourParams;

  constructor(
    private httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const model_ip = this.configService.get('MODEL_IP');
    const port = this.configService.get('MODEL_IP_PORT');
    this.model_ip = `${model_ip}:${port}`;
    this.kakaoapi = this.configService.get('KAKAOAPI_ENDPOINT');
    this.kakaoHeaders = {
      Authorization: 'KakaoAK ' + this.configService.get('KAKAOAPI_KEY'),
    };
    this.tourapi = this.configService.get('TOURAPI_ENDPOINT');
    this.tourParams = {
      ServiceKey: this.configService.get('TOURAPI_DECODED_KEY'),
      MobileOS: 'ETC',
      MobileApp: 'LastDay',
    };
  }

  async getCoordinate(keyword: string): Promise<CoordinateResponsePayload[]> {
    const url = `${this.kakaoapi}`;
    const results = [];
    const response = await this.httpService
      .get(url, {
        params: {
          query: keyword,
          page: 1,
        },
        headers: this.kakaoHeaders,
      })
      .toPromise();
    for (const res of response.data.documents) {
      const { place_name, address_name, x, y } = res;
      const result = {
        title: place_name,
        address: address_name,
        location: { x: x, y: y },
      };
      results.push(result);
    }
    return results as CoordinateResponsePayload[];
  }

  async getRoomRecommendation(
    source_x: number,
    source_y: number,
    dest_x: number,
    dest_y: number,
    content_type: string,
    candidates: number,
    limit_time_hour: number,
    limit_time_min: number,
  ): Promise<RecommendResponsePayload[]> {
    const results = [];
    const endpoint = `${this.model_ip}/room`;
    const response = await this.httpService
      .post(endpoint, {
        source_x: source_x,
        source_y: source_y,
        dest_x: dest_x,
        dest_y: dest_y,
        content_type: content_type,
        candidates: candidates,
        limit_time_hour: limit_time_hour,
        limit_time_min: limit_time_min,
      })
      .toPromise();
    const { recommended } = response.data;
    for (const rec of recommended) {
      const {
        title,
        firstimage,
        mapx,
        mapy,
        addr1,
        travel_time,
        free_time,
        contentid,
      } = rec;
      const result = {
        title: title,
        location: { x: mapx, y: mapy },
        location_string: addr1,
        travel_time: travel_time,
        free_time: free_time,
        contentId: contentid,
      };
      if (firstimage) {
        result['image'] = firstimage;
      }
      results.push(result);
    }
    return results as RecommendResponsePayload[];
  }

  async getStationRecommendation(
    source_x: number,
    source_y: number,
    radius: number,
    content_type: string,
    candidates: number,
    limit_time_hour: number,
    limit_time_min: number,
  ): Promise<RecommendResponsePayload[]> {
    const results = [];
    const endpoint = `${this.model_ip}/station`;
    const response = await this.httpService
      .post(endpoint, {
        source_x: source_x,
        source_y: source_y,
        radius: radius,
        content_type: content_type,
        candidates: candidates,
        limit_time_hour: limit_time_hour,
        limit_time_min: limit_time_min,
      })
      .toPromise();
    const { recommended } = response.data;
    for (const rec of recommended) {
      const {
        title,
        firstimage,
        firstimage2,
        mapx,
        mapy,
        addr1,
        travel_time,
        free_time,
        contentid,
      } = rec;
      const result = {
        title: title,
        location: { x: mapx, y: mapy },
        location_string: addr1,
        travel_time: travel_time,
        free_time: free_time,
        contentId: contentid,
      };
      console.log(firstimage);
      if (firstimage) {
        result['image'] = firstimage;
        result['thumbnail'] = firstimage2;
      }
      results.push(result);
    }
    return results as RecommendResponsePayload[];
  }

  async getPlaceImages(contentId: string): Promise<PlaceImagePayload[]> {
    const url = `${this.tourapi}/detailImage`;
    const tourParams = {
      ...this.tourParams,
      contentId: contentId,
      imageYN: 'Y',
      subImageYN: 'Y',
      numOfRows: 100,
    };
    const raw_response = await this.httpService
      .get(url, { params: tourParams })
      .toPromise();
    const { response } = raw_response.data;
    const results = [];
    if (!response.body.items.item) {
      console.log('no items');
      return results;
    } else if (!Array.isArray(response.body.items.item)) {
    /* 사진이 하나인 경우 Array가 아닌 단일 json 객체로 오기 때문에
    이에 대한 에러케이스 추가 */
      const { originimgurl, smallimageurl } = response.body.items.item;
      results.push({
        imgurl: originimgurl,
        thumbnail: smallimageurl,
      });
    } else {
      for (const item of response.body.items.item) {
        const { originimgurl, smallimageurl } = item;
        results.push({
          imgurl: originimgurl,
          thumbnail: smallimageurl,
        });
      }
    }
    return results;
  }

  async getPlaceIntro(contentId: string, content_type: string): Promise<any> {
    const url = `${this.tourapi}/detailIntro`;
    const tourParams = {
      ...this.tourParams,
      contentId: contentId,
      contentTypeId: content_type,
    };
    const raw_response = await this.httpService
      .get(url, { params: tourParams })
      .toPromise();
    const { response } = raw_response.data;
    console.log(response.body.items.item);
  }

  async getPlaceInfo(contentId: string, content_type: string): Promise<any> {
    const url = `${this.tourapi}/detailInfo`;
    const tourParams = {
      ...this.tourParams,
      contentId: contentId,
      contentTypeId: content_type,
    };
    const raw_response = await this.httpService
      .get(url, { params: tourParams })
      .toPromise();
    const { response } = raw_response.data;
    console.log(response.body.items.item);
  }

  async getPlaceOverall(
    contentId: string,
    content_type: string,
  ): Promise<PlaceInfoResponsePayload> {
    const url = `${this.tourapi}/detailCommon`;
    const tourParams = {
      ...this.tourParams,
      contentId: contentId,
      contentTypeId: content_type,
      defaultYN: 'Y',
      firstImageYN: 'Y',
      overviewYN: 'Y',
      mapinfoYN: 'Y',
    };
    console.log(tourParams);
    const results = await this.httpService
      .get(url, { params: tourParams })
      .toPromise();
    const { response } = results.data;
    var { title, overview, firstimage, firstimage2, homepage, mapx, mapy } =
      response.body.items.item;

    // Overview는 앞에서 3문장까지만 사용
    const re = /.+?\.\s.+?\.\s.+?\.\s/;
    if (re.test(overview)) {
      overview = re.exec(overview)[0];
    }
    // HTML 태그 제거
    overview = overview.replace(/<.+?>/, '');
    const images = await this.getPlaceImages(contentId);
    return {
      contentId: contentId,
      content_type: content_type,
      title: title,
      website: homepage,
      overview: overview,
      image: firstimage,
      thumbnail: firstimage2,
      images: images,
      location: {
        x: mapx,
        y: mapy,
      },
    };
  }
}
